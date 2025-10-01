package com.bucha.controller;

import com.alibaba.fastjson.JSONObject;
import com.bucha.pronunciation.IseFileStreamer;
import com.bucha.pronunciation.IseGlobalMessageBuilder;
import com.bucha.pronunciation.IseGlobalUrlSigner;
import com.bucha.pronunciation.IseGlobalWebSocketClient;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.*;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/ise")
public class IseController {
    private static final Logger logger = LoggerFactory.getLogger(IseController.class);

    @Value("${iflytek.app-id}")
    private String appId;
    @Value("${iflytek.api-key}")
    private String apiKey;
    @Value("${iflytek.api-secret}")
    private String apiSecret;
    @Value("${iflytek.ent:cn_vip}")
    private String defaultEnt;
    @Value("${iflytek.category:read_sentence}")
    private String defaultCategory;
    @Value("${iflytek.sub}")
    private String sub;
    String host = "ise-api-sg.xf-yun.com";
    String requestPath = "/v2/ise";

    @PostMapping(value = "/score", consumes = "multipart/form-data")
    public ResponseEntity<?> score(@RequestPart("text") String text,
                                   @RequestPart("audio") MultipartFile audioFile) throws Exception {

        logger.info("Received upload: name={} size={} bytes contentType={}",
                audioFile.getOriginalFilename(),
                audioFile.getSize(),
                audioFile.getContentType());

        Files.copy(audioFile.getInputStream(), Path.of("check.wav"), StandardCopyOption.REPLACE_EXISTING);

        if (audioFile == null || audioFile.isEmpty()) {
            logger.warn("[IseController] scoreAsync received empty audio file");
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "audio file is empty or missing",
                    "hint", "Use form-data with key 'audio' as File"));
        }

        // 1. Build the first frame message

        logger.info("Original text: {}", text);

        String normalizedText = normalizeText(text);
        logger.info("Normalized text: {}", normalizedText);

        // Use correctedText instead of text in the buildFirstFrame call
        JSONObject firstFrame = IseGlobalMessageBuilder.buildFirstFrame(
                appId, sub, defaultEnt, defaultCategory, normalizedText, "utf-8");

        String signedUrl = IseGlobalUrlSigner.generateSignedUrl(host, apiKey, apiSecret, requestPath);

        // Prepare shared state
        CountDownLatch latch = new CountDownLatch(1);
        final IseGlobalWebSocketClient[] clientRef = new IseGlobalWebSocketClient[1];
        final String[] sidHolder = new String[1];
        final AtomicBoolean resultEmitted = new AtomicBoolean(false);
        final AtomicReference<JSONObject> finalJsonRef = new AtomicReference<>();

        // Cancellation flag: set when server reports error or socket closes
        final AtomicBoolean streamCancelled = new AtomicBoolean(false);

        // Save MultipartFile to a temp file because IseFileStreamer expects a File
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("ise-audio-", ".tmp");
            Files.write(tempFile, audioFile.getBytes());
            File tmp = tempFile.toFile();
            logger.info("{} bytes received.", audioFile.getSize());

            IseGlobalWebSocketClient client = new IseGlobalWebSocketClient(signedUrl, new WebSocketListener() {
                @Override
                public void onOpen(WebSocket webSocket, Response response) {
                    logger.info("WebSocket opened");

                    // Send first frame (JSONObject) as before
                    try {
                        clientRef[0].sendJson(firstFrame);
                    } catch (Throwable e) {
                        logger.error("Failed to send first frame: {}", e.getMessage(), e);
                        streamCancelled.set(true);
                        latch.countDown();
                        return;
                    }

                    // Stream audio in a separate thread to avoid blocking the websocket callback
                    new Thread(() -> {
                        try {
                            java.util.function.Consumer<String> sendJsonConsumer = jsonChunk -> {
                                if (streamCancelled.get()) return; // stop if cancelled
                                try {
                                    com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSONObject.parseObject(jsonChunk);
                                    clientRef[0].sendJson(obj);
                                } catch (Throwable ex) {
                                    logger.error("Failed to parse/send JSON chunk: {}", ex.getMessage(), ex);
                                    streamCancelled.set(true);
                                }
                            };

                            // Stream file: IseFileStreamer will call sendJsonConsumer.accept(json) for each chunk
                            IseFileStreamer.streamFile(tmp, sendJsonConsumer, appId, text, streamCancelled);

                            logger.info("Streaming finished, sent all chunks.");
                        } catch (Exception e) {
                            logger.error("Error while streaming audio file", e);
                            streamCancelled.set(true);
                        }
                    }).start();
                }

                @Override
                public void onMessage(WebSocket webSocket, String textMsg) {
                    logger.info("Received message: {}", textMsg);

                    try {
                        com.alibaba.fastjson.JSONObject resp = com.alibaba.fastjson.JSONObject.parseObject(textMsg);
                        int code = resp.getIntValue("code");

                        if (code != 0) {
                            logger.error("ISE returned error: {}", textMsg);
                            // cancel streaming and signal waiting thread
                            streamCancelled.set(true);
                            latch.countDown();
                            return;
                        }

                        String sid = resp.getString("sid");
                        if (sid != null && sidHolder[0] == null) {
                            sidHolder[0] = sid;
                            logger.info("Session ID (sid) set: {}", sid);
                        }

                        com.alibaba.fastjson.JSONObject dataObj = resp.getJSONObject("data");
                        if (dataObj == null) {
                            logger.warn("No data object in response (might be intermediate ack)");
                            return;
                        }

                        int status = dataObj.getIntValue("status");

                        String base64Data = dataObj.getString("data");

                        if (status == 1) {
                            // intermediate
                            logger.info("Intermediate response (status=1)");
                        } else if (status == 2) {
                            // final
                            if (resultEmitted.compareAndSet(false, true)) {
                                if (base64Data != null && !base64Data.isEmpty()) {
                                    try {
                                        byte[] decoded = Base64.getDecoder().decode(base64Data);

// Log the raw XML to verify
                                        String xmlString = new String(decoded, StandardCharsets.UTF_8);
                                        logger.info("Decoded XML (first 500 chars): {}",
                                                xmlString.length() > 500 ? xmlString.substring(0, 500) : xmlString);

                                        Files.write(Path.of("result.xml"), decoded);

                                        Document doc = null;

                                        try {
                                            // Parse with explicit UTF-8 encoding
                                            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                                            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                                            dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
                                            dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
                                            dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
                                            dbf.setXIncludeAware(false);
                                            dbf.setExpandEntityReferences(false);

                                            DocumentBuilder db = dbf.newDocumentBuilder();

                                            // Use InputSource with UTF-8 reader
                                            InputSource is = new InputSource(new StringReader(xmlString));
                                            is.setEncoding("UTF-8");
                                            doc = db.parse(is);

                                        } catch (Exception parseEx) {
                                            logger.error("Failed to parse XML: {}", parseEx.getMessage(), parseEx);
                                            // Don't try GB18030 fallback - just fail
                                        }

                                        if (doc == null) {
                                            logger.error("Failed to parse XML result; cannot extract scores. Raw base64 data logged.");
                                            logger.info("Raw response message: {}", textMsg);
                                        } else {
                                            Element readSentence = null;
                                            NodeList rsList = doc.getElementsByTagName("read_sentence");
                                            if (rsList != null && rsList.getLength() > 0) {
                                                for (int idx = rsList.getLength() - 1; idx >= 0; idx--) {
                                                    Element cand = (Element) rsList.item(idx);
                                                    String ts = cand.getAttribute("total_score");
                                                    if (ts != null && !ts.isEmpty()) {
                                                        readSentence = cand;
                                                        break;
                                                    }
                                                }
                                                if (readSentence == null) {
                                                    readSentence = (Element) rsList.item(0);
                                                }
                                            }

                                            double totalScore = 0.0d;
                                            double fluencyScore = 0.0d;

                                            if (readSentence != null) {
                                                try {
                                                    String s = readSentence.getAttribute("total_score");
                                                    if (s != null && !s.isEmpty())
                                                        totalScore = Double.parseDouble(s);
                                                } catch (Exception ignore) {
                                                }
                                                try {
                                                    String s = readSentence.getAttribute("fluency_score");
                                                    if (s != null && !s.isEmpty())
                                                        fluencyScore = Double.parseDouble(s);
                                                } catch (Exception ignore) {
                                                }
                                            }

                                            JSONObject finalJson = new JSONObject();
                                            finalJson.put("total_score", totalScore);
                                            finalJson.put("fluency", fluencyScore);

                                            double completeness = 0.0d;
                                            if (readSentence != null) {
                                                String c = readSentence.getAttribute("integrity_score");
                                                if (c == null || c.isEmpty())
                                                    c = readSentence.getAttribute("completeness");
                                                if (c == null || c.isEmpty())
                                                    c = readSentence.getAttribute("accuracy_score");
                                                if (c != null && !c.isEmpty()) {
                                                    try {
                                                        completeness = Double.parseDouble(c);
                                                    } catch (Exception ignore) {
                                                    }
                                                }
                                            }
                                            finalJson.put("completeness", completeness);

                                            java.util.List<String> wrongList = new java.util.ArrayList<>();
                                            if (readSentence != null) {
                                                NodeList words = readSentence.getElementsByTagName("word");
                                                for (int wi = 0; words != null && wi < words.getLength(); wi++) {
                                                    Element w = (Element) words.item(wi);
                                                    boolean hasError = false;
                                                    NodeList phones = w.getElementsByTagName("phone");
                                                    for (int pi = 0; phones != null && pi < phones.getLength(); pi++) {
                                                        Element ph = (Element) phones.item(pi);
                                                        String perr = ph.getAttribute("perr_msg");
                                                        String dpmsg = ph.getAttribute("dp_message");
                                                        if ((perr != null && !perr.isEmpty() && !"0".equals(perr))
                                                                || (dpmsg != null && !dpmsg.isEmpty() && !"0".equals(dpmsg))) {
                                                            hasError = true;
                                                            break;
                                                        }
                                                    }
                                                    if (hasError) {
                                                        String content = w.getAttribute("content");
                                                        if (content == null || content.isEmpty()) {
                                                            content = w.getTextContent() == null ? "" : w.getTextContent().trim();
                                                        }
                                                        if (content != null && !content.isEmpty()) {
                                                            wrongList.add(content);
                                                        }
                                                    }
                                                }
                                            }

                                            com.alibaba.fastjson.JSONArray wrongArr = new com.alibaba.fastjson.JSONArray();
                                            for (String s : wrongList)
                                                wrongArr.add(s);
                                            finalJson.put("wrong_words", wrongArr);

                                            finalJson.put("sid", sidHolder[0]);
                                            finalJson.put("status", 2);

                                            finalJsonRef.set(finalJson);
                                        }
                                    } catch (IllegalArgumentException iae) {
                                        logger.warn("Failed to Base64-decode data field; logging raw response. err={}", iae.getMessage());
                                        logger.info("Final result (raw): {}", textMsg);
                                    }
                                } else if (dataObj.containsKey("result") && dataObj.get("result") != null) {
                                    logger.info("Final result (object): {}", dataObj.get("result"));
                                } else {
                                    logger.info("Final result received but 'data' field is empty: {}", textMsg);
                                }
                            } else {
                                logger.info("Final result already emitted; ignoring duplicate: {}", textMsg);
                            }
                            latch.countDown();
                        } else {
                            logger.info("Response (status={})", status);
                        }
                    } catch (Throwable e) {
                        logger.error("Failed to parse onMessage JSON: {}, err: {}", textMsg, e.getMessage(), e);
                    }
                }

                @Override
                public void onClosed(WebSocket webSocket, int code, String reason) {
                    logger.info("WebSocket closed: {} {}", code, reason);
                    streamCancelled.set(true);
                    latch.countDown();
                }

                @Override
                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                    logger.error("WebSocket error", t);
                    streamCancelled.set(true);
                    latch.countDown();
                }
            });

            clientRef[0] = client;
            client.connect();

            // wait for result (best-effort timeout)
            latch.await(120, TimeUnit.SECONDS);
            try {
                client.close();
            } catch (Exception ignore) {}
            logger.info("Demo finished.");

            if (finalJsonRef.get() != null) {
                return ResponseEntity.ok(finalJsonRef.get().toJSONString());
            } else {
                return ResponseEntity.status(500).body(Collections.singletonMap("error", "no result from ISE"));
            }

        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (Exception ignore) {
                }
            }
        }
    }

    private String normalizeText(String text) {
        if (text == null) return "";

        // Normalize punctuation to fullwidth Chinese style
        return text
                .replace("!", "！")
                .replace("?", "？")
                .replace(",", "，")
                .replace(".", "。")
                .replace(";", "；")
                .replace(":", "：")
                .trim();
    }
}
