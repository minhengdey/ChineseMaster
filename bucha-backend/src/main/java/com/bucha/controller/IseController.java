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

import javax.sound.sampled.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.Base64;
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
            @RequestPart("audio") MultipartFile audioFile,
            @RequestPart(value = "sub", required = false) String reqSub,
            @RequestPart(value = "ent", required = false) String reqEnt) throws Exception {
        logger.info("Received upload: name={} size={} contentType={}",
                audioFile == null ? null : audioFile.getOriginalFilename(),
                audioFile == null ? null : audioFile.getSize(),
                audioFile == null ? null : audioFile.getContentType());

        if (audioFile == null || audioFile.isEmpty()) {
            logger.warn("[IseController] score received empty audio file");
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "audio file is empty or missing",
                    "hint", "Use form-data with key 'audio' as File"));
        }

        final String normalizedText = normalizeText(text);
        logger.info("Original text: {}", text);
        logger.info("Normalized text: {}", normalizedText);

        final AtomicReference<JSONObject> firstFrameRef = new AtomicReference<>();
        try {
            JSONObject built = IseGlobalMessageBuilder.buildFirstFrame(
                    appId,
                    reqSub != null && !reqSub.isEmpty() ? reqSub : sub,
                    reqEnt != null && !reqEnt.isEmpty() ? reqEnt : defaultEnt,
                    defaultCategory,
                    normalizedText,
                    "utf-8");

            if (built.containsKey("parameter")) {
                try {
                    JSONObject parameter = built.getJSONObject("parameter");
                    if (parameter == null) {
                        parameter = new JSONObject();
                        built.put("parameter", parameter);
                    }
                    JSONObject st = parameter.getJSONObject("st");
                    if (st == null) {
                        st = new JSONObject();
                        parameter.put("st", st);
                    }
                    st.put("core", "read_sentence");
                    st.put("phoneme_output", "1");
                    st.put("ref_text", normalizedText);
                } catch (Throwable t) {
                    logger.warn("Could not safely modify built.parameter: {}", t.getMessage());
                }
            } else if (built.containsKey("params")) {
                try {
                    JSONObject parameter = built.getJSONObject("params");
                    if (parameter == null) {
                        parameter = new JSONObject();
                        built.put("params", parameter);
                    }
                    JSONObject st = parameter.getJSONObject("st");
                    if (st == null) {
                        st = new JSONObject();
                        parameter.put("st", st);
                    }
                    st.put("core", "read_sentence");
                    st.put("phoneme_output", "1");
                    st.put("ref_text", normalizedText);
                } catch (Throwable t) {
                    logger.warn("Could not safely modify built.params: {}", t.getMessage());
                }
            } else {
                logger.warn(
                        "Builder returned unexpected frame shape; not injecting parameter to avoid server validation errors. firstFrame: {}",
                        built.toJSONString());
            }

            firstFrameRef.set(built);
        } catch (Throwable e) {
            logger.error("Failed to build firstFrame: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "failed to build ISE first frame", "detail", e.getMessage()));
        }

        String signedUrl = IseGlobalUrlSigner.generateSignedUrl(host, apiKey, apiSecret, requestPath);

        final AtomicReference<IseGlobalWebSocketClient> clientRef = new AtomicReference<>();
        final AtomicReference<String> sidRef = new AtomicReference<>();
        final AtomicReference<JSONObject> sentenceJsonRef = new AtomicReference<>();
        final AtomicBoolean resultEmitted = new AtomicBoolean(false);
        final AtomicBoolean streamCancelled = new AtomicBoolean(false);
        final AtomicReference<File> wavTempRef = new AtomicReference<>();
        final AtomicReference<Path> uploadedTempRef = new AtomicReference<>();

        CountDownLatch latch = new CountDownLatch(1);

        try {
            Path uploadedTemp = Files.createTempFile("ise-upload-", getExtensionSafe(audioFile.getOriginalFilename()));
            try (InputStream in = audioFile.getInputStream()) {
                Files.copy(in, uploadedTemp, StandardCopyOption.REPLACE_EXISTING);
            }
            uploadedTempRef.set(uploadedTemp);

            try {
                File wavFile = ensureWavFile(uploadedTemp, audioFile.getOriginalFilename(), audioFile.getContentType());
                wavTempRef.set(wavFile);
                logger.info("Prepared WAV temp file: {}, size={}", wavFile.getAbsolutePath(), wavFile.length());
            } catch (UnsupportedAudioFileException uafe) {
                logger.warn("Unsupported audio format by Java Sound: {}", uafe.getMessage());
                return ResponseEntity.status(415).body(Map.of(
                        "error", "Unsupported audio format by server (Java Sound)",
                        "hint", "Provide WAV/AIFF/AU or enable JavaSound SPI / allow ffmpeg"));
            } catch (IOException | InterruptedException convEx) {
                logger.error("Conversion to WAV failed: {}", convEx.getMessage(), convEx);
                return ResponseEntity.status(500)
                        .body(Map.of("error", "audio conversion failed", "detail", convEx.getMessage()));
            }

            IseGlobalWebSocketClient client = new IseGlobalWebSocketClient(signedUrl, new WebSocketListener() {
                @Override
                public void onOpen(WebSocket webSocket, Response response) {
                    logger.info("WebSocket opened (sentence)");
                    try {
                        clientRef.get().sendJson(firstFrameRef.get());
                    } catch (Throwable e) {
                        logger.error("Failed to send first frame: {}", e.getMessage(), e);
                        streamCancelled.set(true);
                        latch.countDown();
                        return;
                    }

                    new Thread(() -> {
                        try {
                            File wavToStream = wavTempRef.get();
                            if (wavToStream == null) {
                                logger.error("WAV file is missing at streaming time");
                                streamCancelled.set(true);
                                latch.countDown();
                                return;
                            }

                            java.util.function.Consumer<String> sendJsonConsumer = jsonChunk -> {
                                if (streamCancelled.get())
                                    return;
                                try {
                                    com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSONObject
                                            .parseObject(jsonChunk);
                                    clientRef.get().sendJson(obj);
                                } catch (Throwable ex) {
                                    logger.error("Failed to parse/send JSON chunk: {}", ex.getMessage(), ex);
                                    streamCancelled.set(true);
                                }
                            };

                            IseFileStreamer.streamFile(wavToStream, sendJsonConsumer, appId, normalizedText,
                                    streamCancelled);
                            logger.info("Streaming finished (sentence)");
                        } catch (Exception e) {
                            logger.error("Error while streaming audio file (sentence)", e);
                            streamCancelled.set(true);
                            latch.countDown();
                        }
                    }, "ise-sentence-stream").start();
                }

                @Override
                public void onMessage(WebSocket webSocket, String textMsg) {
                    logger.debug("Received message (sentence): {}", textMsg);
                    try {
                        com.alibaba.fastjson.JSONObject resp = com.alibaba.fastjson.JSONObject.parseObject(textMsg);
                        int code = resp.getIntValue("code");
                        if (code != 0) {
                            logger.error("ISE returned error (sentence): {}", textMsg);
                            streamCancelled.set(true);
                            latch.countDown();
                            return;
                        }

                        logger.info(resp.toString());

                        String sid = resp.getString("sid");
                        if (sid != null && sidRef.get() == null)
                            sidRef.set(sid);

                        com.alibaba.fastjson.JSONObject dataObj = resp.getJSONObject("data");
                        if (dataObj == null)
                            return;

                        int status = dataObj.getIntValue("status");
                        String base64Data = dataObj.getString("data");

                        if (status == 2) {
                            if (resultEmitted.compareAndSet(false, true)) {
                                if (base64Data != null && !base64Data.isEmpty()) {
                                    try {
                                        byte[] decoded = Base64.getDecoder().decode(base64Data);
                                        String xmlString = new String(decoded, StandardCharsets.UTF_8);
                                        Files.write(Path.of("result.xml"), decoded);

                                        Document doc = parseXmlSafely(xmlString);
                                        if (doc == null) {
                                            logger.error("Failed to parse XML result (sentence)");
                                        } else {
                                            JSONObject sentenceOut = new JSONObject();
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
                                                if (readSentence == null)
                                                    readSentence = (Element) rsList.item(0);
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
                                            sentenceOut.put("total_score", totalScore);
                                            sentenceOut.put("fluency", fluencyScore);

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
                                            sentenceOut.put("completeness", completeness);

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
                                                                || (dpmsg != null && !dpmsg.isEmpty()
                                                                        && !"0".equals(dpmsg))) {
                                                            hasError = true;
                                                            break;
                                                        }
                                                    }
                                                    if (hasError) {
                                                        String content = w.getAttribute("content");
                                                        if (content == null || content.isEmpty()) {
                                                            content = w.getTextContent() == null ? ""
                                                                    : w.getTextContent().trim();
                                                        }
                                                        if (content != null && !content.isEmpty())
                                                            wrongList.add(content);
                                                    }
                                                }
                                            }
                                            com.alibaba.fastjson.JSONArray wrongArr = new com.alibaba.fastjson.JSONArray();
                                            for (String s : wrongList)
                                                wrongArr.add(s);
                                            sentenceOut.put("wrong_words", wrongArr);

                                            sentenceOut.put("raw_xml", xmlString);
                                            sentenceOut.put("sid", sidRef.get());
                                            sentenceOut.put("status", 2);

                                            sentenceJsonRef.set(sentenceOut);
                                        }
                                    } catch (IllegalArgumentException iae) {
                                        logger.warn("Failed to Base64-decode data field; logging raw response. err={}",
                                                iae.getMessage());
                                    }
                                } else {
                                    logger.info("Final result had empty data field");
                                }
                            }
                            latch.countDown();
                        }
                    } catch (Throwable e) {
                        logger.error("Failed to parse onMessage JSON (sentence): {}, err: {}", textMsg, e.getMessage(),
                                e);
                    }
                }

                @Override
                public void onClosed(WebSocket webSocket, int code, String reason) {
                    logger.info("WebSocket closed (sentence): {} {}", code, reason);
                    streamCancelled.set(true);
                    latch.countDown();
                }

                @Override
                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                    logger.error("WebSocket error (sentence)", t);
                    streamCancelled.set(true);
                    latch.countDown();
                }
            });

            clientRef.set(client);
            client.connect();

            latch.await(120, TimeUnit.SECONDS);
            try {
                client.close();
            } catch (Exception ignore) {
            }
            logger.info("Sentence-level ISE interaction finished.");

            if (sentenceJsonRef.get() == null) {
                return ResponseEntity.status(500)
                        .body(Collections.singletonMap("error", "no result from ISE (sentence)"));
            }

            JSONObject sentenceResult = sentenceJsonRef.get();
            String rawXml = sentenceResult.getString("raw_xml");
            List<JSONObject> wordsResults = new ArrayList<>();

            Document doc = parseXmlSafely(rawXml);
            NodeList words = null;
            if (doc != null) {
                NodeList rsList = doc.getElementsByTagName("read_sentence");
                Element readSentence = null;
                if (rsList != null && rsList.getLength() > 0)
                    readSentence = (Element) rsList.item(0);
                if (readSentence != null)
                    words = readSentence.getElementsByTagName("word");
                if (words == null || words.getLength() == 0)
                    words = doc.getElementsByTagName("word");
            }

            if (words != null && words.getLength() > 0) {
                for (int i = 0; i < words.getLength(); i++) {
                    Element w = (Element) words.item(i);
                    String content = w.getAttribute("content");
                    if (content == null || content.isEmpty())
                        content = w.getTextContent() == null ? "" : w.getTextContent().trim();
                    if (content == null || content.isEmpty())
                        continue;
                    logger.info("Scoring sub-word (from XML): {}", content);
                    try {
                        JSONObject wRes = extractWordScoresFromElement(w);
                        wRes.put("word", content);
                        wordsResults.add(wRes);
                    } catch (Exception e) {
                        logger.error("Failed to score word '{}': {}", content, e.getMessage(), e);
                        JSONObject err = new JSONObject();
                        err.put("word", content);
                        err.put("error", e.getMessage());
                        wordsResults.add(err);
                    }
                }
            } else {
                String[] toks = normalizedText.split("\\s+");
                for (String tok : toks) {
                    if (tok == null || tok.isEmpty())
                        continue;
                    logger.info("Scoring token fallback: {}", tok);
                    try {
                        JSONObject wRes = scoreSingleWord(wavTempRef.get(), tok);
                        wRes.put("word", tok);
                        wordsResults.add(wRes);
                    } catch (Exception e) {
                        logger.error("Failed to score token '{}': {}", tok, e.getMessage(), e);
                        JSONObject err = new JSONObject();
                        err.put("word", tok);
                        err.put("error", e.getMessage());
                        wordsResults.add(err);
                    }
                }
            }

            JSONObject response = new JSONObject();
            response.put("sentence", sentenceResult);
            response.put("words", wordsResults);

            return ResponseEntity.ok(response.toJSONString());

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            logger.error("Interrupted while waiting for ISE", ie);
            return ResponseEntity.status(500).body(Map.of("error", "interrupted"));
        } catch (Exception ex) {
            logger.error("Unexpected error in score", ex);
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        } finally {
            try {
                File wavToDelete = wavTempRef.get();
                if (wavToDelete != null && wavToDelete.exists())
                    Files.deleteIfExists(wavToDelete.toPath());
            } catch (Exception ignored) {
            }
            try {
                Path uploadedPath = uploadedTempRef.get();
                if (uploadedPath != null)
                    Files.deleteIfExists(uploadedPath);
            } catch (Exception ignored) {
            }
        }
    }

    private JSONObject scoreSingleWord(File wavFile, String word) throws Exception {
        if (wavFile == null || !wavFile.exists())
            throw new IllegalArgumentException("wav file missing");

        final AtomicReference<JSONObject> builtRef = new AtomicReference<>();
        try {
            JSONObject b = IseGlobalMessageBuilder.buildFirstFrame(appId, sub, defaultEnt, "read_word", word, "utf-8");
            builtRef.set(b);
        } catch (Throwable t) {
            JSONObject fallback = new JSONObject();
            JSONObject header = new JSONObject();
            header.put("app_id", appId);
            fallback.put("header", header);
            JSONObject parameter = new JSONObject();
            JSONObject st = new JSONObject();
            st.put("core", "word");
            st.put("ref_text", word);
            st.put("phoneme_output", "1");
            parameter.put("st", st);
            fallback.put("parameter", parameter);
            builtRef.set(fallback);
        }

        if (builtRef.get().containsKey("parameter")) {
            try {
                JSONObject parameter = builtRef.get().getJSONObject("parameter");
                if (parameter == null) {
                    parameter = new JSONObject();
                    builtRef.get().put("parameter", parameter);
                }
                JSONObject st = parameter.getJSONObject("st");
                if (st == null) {
                    st = new JSONObject();
                    parameter.put("st", st);
                }
                st.put("core", "word");
                st.put("phoneme_output", "1");
                st.put("ref_text", word);
            } catch (Throwable ignored) {
            }
        } else if (builtRef.get().containsKey("params")) {
            try {
                JSONObject parameter = builtRef.get().getJSONObject("params");
                if (parameter == null) {
                    parameter = new JSONObject();
                    builtRef.get().put("params", parameter);
                }
                JSONObject st = parameter.getJSONObject("st");
                if (st == null) {
                    st = new JSONObject();
                    parameter.put("st", st);
                }
                st.put("core", "word");
                st.put("phoneme_output", "1");
                st.put("ref_text", word);
            } catch (Throwable ignored) {
            }
        }

        String signedUrl = IseGlobalUrlSigner.generateSignedUrl(host, apiKey, apiSecret, requestPath);

        final AtomicReference<JSONObject> finalJsonRef = new AtomicReference<>();
        final AtomicBoolean resultEmitted = new AtomicBoolean(false);
        final AtomicBoolean streamCancelled = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);

        final AtomicReference<IseGlobalWebSocketClient> clientRefLocal = new AtomicReference<>();

        IseGlobalWebSocketClient client = new IseGlobalWebSocketClient(signedUrl, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                try {
                    clientRefLocal.get().sendJson(builtRef.get());
                } catch (Throwable e) {
                    logger.error("Failed to send first frame for word {}", word, e);
                    streamCancelled.set(true);
                    latch.countDown();
                    return;
                }

                new Thread(() -> {
                    try {
                        java.util.function.Consumer<String> sendJsonConsumer = jsonChunk -> {
                            if (streamCancelled.get())
                                return;
                            try {
                                com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSONObject
                                        .parseObject(jsonChunk);
                                clientRefLocal.get().sendJson(obj);
                            } catch (Throwable ex) {
                                logger.error("Failed to parse/send JSON chunk for word {}: {}", word, ex.getMessage(),
                                        ex);
                                streamCancelled.set(true);
                            }
                        };
                        IseFileStreamer.streamFile(wavFile, sendJsonConsumer, appId, word, streamCancelled);
                    } catch (Exception e) {
                        logger.error("Error while streaming audio file for word {}", word, e);
                        streamCancelled.set(true);
                        latch.countDown();
                    }
                }, "ise-word-stream").start();
            }

            @Override
            public void onMessage(WebSocket webSocket, String textMsg) {
                try {
                    com.alibaba.fastjson.JSONObject resp = com.alibaba.fastjson.JSONObject.parseObject(textMsg);
                    int code = resp.getIntValue("code");
                    if (code != 0) {
                        logger.error("ISE returned error for word {}: {}", word, textMsg);
                        streamCancelled.set(true);
                        latch.countDown();
                        return;
                    }
                    com.alibaba.fastjson.JSONObject dataObj = resp.getJSONObject("data");
                    if (dataObj == null)
                        return;
                    int status = dataObj.getIntValue("status");
                    String base64Data = dataObj.getString("data");
                    if (status == 2) {
                        if (resultEmitted.compareAndSet(false, true)) {
                            if (base64Data != null && !base64Data.isEmpty()) {
                                try {
                                    byte[] decoded = Base64.getDecoder().decode(base64Data);
                                    String xmlString = new String(decoded, StandardCharsets.UTF_8);
                                    Document doc = parseXmlSafely(xmlString);
                                    if (doc != null) {
                                        JSONObject out = extractWordScores(doc);
                                        finalJsonRef.set(out);
                                    } else {
                                        JSONObject err = new JSONObject();
                                        err.put("error", "failed to parse xml");
                                        finalJsonRef.set(err);
                                    }
                                } catch (IllegalArgumentException iae) {
                                    JSONObject err = new JSONObject();
                                    err.put("error", "invalid base64");
                                    finalJsonRef.set(err);
                                }
                            }
                        }
                        latch.countDown();
                    }
                } catch (Throwable e) {
                    logger.error("Failed to parse onMessage JSON (word {}): {}, err: {}", word, textMsg, e.getMessage(),
                            e);
                }
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                streamCancelled.set(true);
                latch.countDown();
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                logger.error("WebSocket error for word {}", word, t);
                streamCancelled.set(true);
                latch.countDown();
            }
        });

        clientRefLocal.set(client);

        client.connect();
        latch.await(90, TimeUnit.SECONDS);
        try {
            client.close();
        } catch (Exception ignore) {
        }

        if (finalJsonRef.get() != null)
            return finalJsonRef.get();
        JSONObject err = new JSONObject();
        err.put("error", "no result");
        return err;
    }

    private Document parseXmlSafely(String xmlString) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
            dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            dbf.setXIncludeAware(false);
            dbf.setExpandEntityReferences(false);

            DocumentBuilder db = dbf.newDocumentBuilder();
            InputSource is = new InputSource(new StringReader(xmlString));
            is.setEncoding("UTF-8");
            return db.parse(is);
        } catch (Exception e) {
            logger.error("XML parse error: {}", e.getMessage(), e);
            return null;
        }
    }

    private JSONObject extractWordScores(Document doc) {
        Element readSentence = null;
        NodeList rsList = doc.getElementsByTagName("read_sentence");
        if (rsList != null && rsList.getLength() > 0) {
            for (int i = rsList.getLength() - 1; i >= 0; i--) {
                Element cand = (Element) rsList.item(i);
                if (cand.hasAttribute("total_score") || cand.hasAttribute("phone_score")
                        || cand.hasAttribute("fluency_score")) {
                    readSentence = cand;
                    break;
                }
            }
            if (readSentence == null)
                readSentence = (Element) rsList.item(0);
        }

        Element wordElem = null;
        NodeList wn = doc.getElementsByTagName("word");
        if (wn != null && wn.getLength() > 0)
            wordElem = (Element) wn.item(0);

        JSONObject out = new JSONObject();
        out.put("overall", 0);
        out.put("pronunciation", 0);
        out.put("tone", 0);
        out.put("duration", 0);
        out.put("completeness", 0);
        out.put("fluency", 0);

        if (readSentence != null) {
            out.put("overall", getAttrDouble(readSentence, "total_score", "overall_score", "score"));
            out.put("pronunciation",
                    getAttrDouble(readSentence, "phone_score", "pronunciation_score", "pronunciation"));
            out.put("tone", getAttrDouble(readSentence, "tone_score", "tone"));
            out.put("duration", getAttrDouble(readSentence, "time_len", "duration"));
            out.put("completeness", getAttrDouble(readSentence, "integrity_score", "completeness", "accuracy_score"));
            out.put("fluency", getAttrDouble(readSentence, "fluency_score"));
        } else if (wordElem != null) {
            Node parent = wordElem.getParentNode();
            if (parent instanceof Element) {
                Element par = (Element) parent;
                out.put("overall", getAttrDouble(par, "total_score", "overall_score", "score"));
                out.put("pronunciation", getAttrDouble(par, "phone_score", "pronunciation_score", "pronunciation"));
                out.put("tone", getAttrDouble(par, "tone_score", "tone"));
                out.put("duration", getAttrDouble(par, "time_len", "duration"));
                out.put("completeness", getAttrDouble(par, "integrity_score", "completeness", "accuracy_score"));
                out.put("fluency", getAttrDouble(par, "fluency_score"));
            }
        }

        com.alibaba.fastjson.JSONArray phonemeArr = new com.alibaba.fastjson.JSONArray();
        NodeList phones = null;
        if (wordElem != null)
            phones = wordElem.getElementsByTagName("phone");
        if (phones == null || phones.getLength() == 0) {
            phones = doc.getElementsByTagName("phone");
        }

        double fallbackPhoneScore = 0.0d;
        if (wordElem != null) {
            fallbackPhoneScore = getAttrDouble(wordElem, "phone_score", "phoneScore", "phone-score");
            if (fallbackPhoneScore == 0.0d) {
                Node parent = wordElem.getParentNode();
                if (parent instanceof Element) {
                    fallbackPhoneScore = getAttrDouble((Element) parent, "phone_score", "phoneScore", "phone-score");
                }
            }
        }

        double accPhoneScore = 0.0d;
        double accToneScore = 0.0d;
        int countPhoneScore = 0;
        int countToneScore = 0;
        int totalPhonesSeen = 0;
        int goodPhonesCount = 0;

        Set<String> seenPhonemes = new HashSet<>();

        for (int i = 0; phones != null && i < phones.getLength(); i++) {
            Element ph = (Element) phones.item(i);

            String pContent = safeAttr(ph, "content", "p", "phoneme", "phone");
            if ((pContent == null || pContent.isEmpty()) && ph.getTextContent() != null) {
                pContent = ph.getTextContent().trim();
            }
            if (pContent == null)
                pContent = "";

            // Skip silence phonemes
            if ("sil".equalsIgnoreCase(pContent) || "silv".equalsIgnoreCase(pContent)) {
                continue;
            }

            // Skip duplicates (based on content + position)
            double start = getAttrDouble(ph, "beg_pos", "begin", "start", "start_pos");
            String uniqueKey = pContent + "_" + start;
            if (seenPhonemes.contains(uniqueKey)) {
                continue;
            }
            seenPhonemes.add(uniqueKey);

            JSONObject p = new JSONObject();
            p.put("phoneme", pContent);
            // human-friendly display: collapse repeated letters ("iii" -> "i") and trim
            // leading underscores
            String display = pContent == null ? "" : pContent.replaceAll("^_+", "").replaceAll("(.)\\1{1,}", "$1");
            p.put("phoneme_display", display);

            String monoTone = safeAttr(ph, "mono_tone", "mono_tone_msg", "mono-tone");
            p.put("mono_tone", monoTone == null ? "" : monoTone);

            double phScore = getAttrDouble(ph, "phone_score", "phoneme_score", "pronunciation", "pronunciation_score",
                    "score");
            if (phScore == 0.0d) {
                phScore = computePhoneScoreForPhone(ph, fallbackPhoneScore);
            }
            p.put("score", phScore);

            String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
            String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
            p.put("perr_msg", perr == null ? "" : perr);
            p.put("dp_message", dpmsg == null ? "" : dpmsg);

            double end = getAttrDouble(ph, "end_pos", "end", "time_len");
            p.put("start", start);
            p.put("end", end);

            double toneScore = getAttrDouble(ph, "tone_score", "tone");
            if (toneScore == 0.0d) {
                toneScore = computeToneScoreForPhone(ph, wordElem, monoTone);
            }
            p.put("tone_score", toneScore);

            String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
            String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
            p.put("perr_level_msg", perrLevel == null ? "" : perrLevel);
            p.put("is_yun", isYun == null ? "" : isYun);

            phonemeArr.add(p);

            totalPhonesSeen++;
            int dp = 0;
            try {
                dp = Integer.parseInt(dpmsg == null || dpmsg.isEmpty() ? "0" : dpmsg);
            } catch (Exception ignored) {
            }
            if (dp == 0) {
                if (phScore > 0.0d) {
                    accPhoneScore += phScore;
                    countPhoneScore++;
                }
                if (toneScore > 0.0d) {
                    accToneScore += toneScore;
                    countToneScore++;
                }
                goodPhonesCount++;
            }
        }

        out.put("phonemes", phonemeArr);

        double overall = out.getDoubleValue("overall");
        double pron = out.getDoubleValue("pronunciation");
        double tone = out.getDoubleValue("tone");
        double fluency = out.getDoubleValue("fluency");

        if ((overall == 0.0d || pron == 0.0d) && countPhoneScore > 0) {
            double avgPhone = accPhoneScore / countPhoneScore;
            overall = Math.min(100.0, Math.max(0.0, avgPhone));
            pron = overall;
        } else if ((overall == 0.0d || pron == 0.0d) && fallbackPhoneScore > 0.0d) {
            overall = Math.min(100.0, fallbackPhoneScore);
            pron = overall;
        }

        if (tone == 0.0d && countToneScore > 0) {
            tone = Math.min(100.0, accToneScore / countToneScore);
        }

        if (fluency == 0.0d) {
            if (totalPhonesSeen > 0) {
                fluency = ((double) goodPhonesCount / (double) totalPhonesSeen) * 100.0;
            } else {
                fluency = 0.0d;
            }
        }

        out.put("overall", overall);
        out.put("pronunciation", pron);
        out.put("tone", tone);

        if (out.getDoubleValue("duration") == 0.0d) {
            double durMs = 0.0d;
            for (int i = 0; i < phonemeArr.size(); i++) {
                JSONObject p = phonemeArr.getJSONObject(i);
                double s = p.getDoubleValue("start");
                double e = p.getDoubleValue("end");
                if (e > s)
                    durMs += (e - s);
            }
            out.put("duration", durMs);
        }

        if (out.getDoubleValue("completeness") == 0.0d) {
            double comp = 0.0d;
            if (readSentence != null)
                comp = getAttrDouble(readSentence, "integrity_score", "completeness", "accuracy_score");
            if (comp == 0.0d && totalPhonesSeen > 0)
                comp = ((double) goodPhonesCount / (double) totalPhonesSeen) * 100.0;
            out.put("completeness", comp);
        }

        out.put("fluency", fluency);

        return out;
    }

    private double computeToneScoreForPhone(Element ph, Element wordElem, String monoTone) {
        double explicitTone = getAttrDouble(ph, "tone_score", "tone", "mono_tone_score");
        if (explicitTone > 0.0d)
            return explicitTone;

        if (monoTone != null && !monoTone.isEmpty()) {
            double monoScore = monoToneToScore(monoTone, ph, wordElem);
            if (monoScore > 0.0d)
                return monoScore;
        }

        String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
        int dp = 0;
        try {
            dp = Integer.parseInt(dpmsg == null ? "0" : dpmsg);
        } catch (Exception ignored) {
        }

        if (dp != 0)
            return 0.0d;

        String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
        int perrInt = -1;
        try {
            perrInt = Integer.parseInt(perr == null ? "-1" : perr);
        } catch (Exception ignored) {
        }

        String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
        int perrLevelInt = 0;
        try {
            perrLevelInt = Integer.parseInt(perrLevel == null ? "0" : perrLevel);
        } catch (Exception ignored) {
        }

        String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
        int isYunInt = 0;
        try {
            isYunInt = Integer.parseInt(isYun == null ? "0" : isYun);
        } catch (Exception ignored) {
        }

        if (perrInt >= 0) {
            double base;
            if (isYunInt == 1) {
                switch (perrInt) {
                    case 0:
                        base = 100.0;
                        break;
                    case 1:
                        base = 60.0;
                        break;
                    case 2:
                        base = 20.0;
                        break;
                    case 3:
                        base = 0.0;
                        break;
                    default:
                        base = 50.0;
                        break;
                }
            } else {
                base = (perrInt == 0) ? 100.0 : 50.0;
            }
            double factor = 1.0;
            if (perrLevelInt >= 1)
                factor = 1.0 - (perrLevelInt - 1) * 0.15;
            double toneScore = Math.max(0.0, Math.min(100.0, base * factor));
            return toneScore;
        }

        double fallback = getAttrDouble(ph, "phone_score", "tone_score", "tone");
        if (fallback > 0.0d)
            return fallback;
        if (wordElem != null) {
            double wfb = getAttrDouble(wordElem, "tone_score", "phone_score", "phoneScore");
            if (wfb > 0.0d)
                return wfb;
        }
        return 0.0d;
    }

    private double monoToneToScore(String monoTone, Element ph, Element wordElem) {
        if (monoTone == null || monoTone.isEmpty())
            return 0.0d;

        String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
        int dp = 0;
        try {
            dp = Integer.parseInt(dpmsg == null || dpmsg.isEmpty() ? "0" : dpmsg);
        } catch (Exception ignored) {
        }
        if (dp != 0)
            return 0.0d;

        String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
        int perrInt = -1;
        try {
            perrInt = Integer.parseInt(perr == null || perr.isEmpty() ? "-1" : perr);
        } catch (Exception ignored) {
        }

        if (perrInt == 0)
            return 100.0d;
        if (perrInt > 0)
            return 50.0d;

        String t = monoTone.toUpperCase();
        if (t.startsWith("TONE")) {
            return 100.0d;
        }

        if (wordElem != null) {
            double wfb = getAttrDouble(wordElem, "tone_score", "phone_score", "phoneScore");
            if (wfb > 0.0d)
                return wfb;
        }
        return 0.0d;
    }

    private double getAttrDouble(Element e, String... keys) {
        for (String k : keys) {
            try {
                String v = e.getAttribute(k);
                if (v != null && !v.isEmpty())
                    return Double.parseDouble(v);
            } catch (Exception ignored) {
            }
        }
        return 0.0d;
    }

    private String normalizeText(String text) {
        if (text == null)
            return "";
        return text.replace("\uFEFF", "").trim().replace("!", "！").replace("?", "？").replace(",", "，")
                .replace(".", "。").replace(";", "；").replace(":", "：").trim();
    }

    private File convertToWavWithFfmpeg(File inputFile) throws IOException, InterruptedException {
        String ffmpegPath = System.getenv().getOrDefault("FFMPEG_PATH", "ffmpeg");
        Path out = Files.createTempFile("ise-out-", ".wav");
        File outFile = out.toFile();
        ProcessBuilder pb = new ProcessBuilder(ffmpegPath, "-y", "-i", inputFile.getAbsolutePath(), "-ar", "16000",
                "-ac", "1", "-sample_fmt", "s16", outFile.getAbsolutePath());
        pb.redirectErrorStream(true);
        Process p = pb.start();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line;
            while ((line = br.readLine()) != null)
                logger.debug("ffmpeg: {}", line);
        }
        boolean finished = p.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            throw new IOException("ffmpeg timeout (killed)");
        }
        int exit = p.exitValue();
        if (exit != 0)
            throw new IOException("ffmpeg failed, exit code=" + exit);
        if (!outFile.exists() || outFile.length() == 0)
            throw new IOException("ffmpeg produced empty output");
        return outFile;
    }

    private File ensureWavFile(Path uploadedTempFile, String originalFilename, String contentType) throws Exception {
        String lowerName = originalFilename == null ? "" : originalFilename.toLowerCase();
        String ct = contentType == null ? "" : contentType.toLowerCase();

        if (lowerName.endsWith(".wav") || ct.contains("wav")) {
            Path wavCopy = Files.createTempFile("ise-wav-", ".wav");
            Files.copy(uploadedTempFile, wavCopy, StandardCopyOption.REPLACE_EXISTING);
            return wavCopy.toFile();
        }

        if (lowerName.endsWith(".webm") || ct.contains("webm") || lowerName.endsWith(".ogg") || ct.contains("ogg")
                || lowerName.endsWith(".opus") || ct.contains("opus") || lowerName.endsWith(".mp3")
                || ct.contains("mp3")) {
            try {
                return convertToWavWithFfmpeg(uploadedTempFile.toFile());
            } catch (IOException | InterruptedException e) {
                logger.error("ffmpeg conversion failed: {}", e.getMessage(), e);
                throw e;
            }
        }

        try {
            return convertUsingJavaSound(uploadedTempFile.toFile());
        } catch (UnsupportedAudioFileException uafe) {
            logger.warn("JavaSound cannot decode uploaded file: {}", uafe.getMessage());
            throw uafe;
        }
    }

    private File convertUsingJavaSound(File inputFile) throws IOException, UnsupportedAudioFileException {
        Path outTemp = Files.createTempFile("ise-out-js-", ".wav");
        try (AudioInputStream sourceAis = AudioSystem.getAudioInputStream(inputFile)) {
            AudioFormat sourceFormat = sourceAis.getFormat();
            AudioFormat targetFormat = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED, sourceFormat.getSampleRate(),
                    16, sourceFormat.getChannels(), sourceFormat.getChannels() * 2, sourceFormat.getSampleRate(),
                    false);
            AudioInputStream pcmAis;
            if (AudioSystem.isConversionSupported(targetFormat, sourceFormat))
                pcmAis = AudioSystem.getAudioInputStream(targetFormat, sourceAis);
            else if (sourceFormat.getEncoding().equals(AudioFormat.Encoding.PCM_SIGNED)
                    && sourceFormat.getSampleSizeInBits() == 16 && !sourceFormat.isBigEndian())
                pcmAis = sourceAis;
            else
                throw new UnsupportedAudioFileException("Java Sound cannot convert format: " + sourceFormat);
            AudioSystem.write(pcmAis, AudioFileFormat.Type.WAVE, outTemp.toFile());
            return outTemp.toFile();
        }
    }

    private String getExtensionSafe(String filename) {
        if (filename == null)
            return ".tmp";
        int i = filename.lastIndexOf('.');
        if (i < 0)
            return ".tmp";
        String ext = filename.substring(i);
        if (ext.matches("\\.[A-Za-z0-9]+"))
            return ext;
        return ".tmp";
    }

    private String safeAttr(Element e, String... names) {
        for (String n : names) {
            try {
                String v = e.getAttribute(n);
                if (v != null && !v.isEmpty())
                    return v;
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private double computePhoneScoreForPhone(Element ph, double fallbackPhoneScore) {
        String dpmsg = safeAttr(ph, "dp_message", "dp_message", "dpmsg", "dp-message");
        int dp = 0;
        try {
            dp = Integer.parseInt(dpmsg == null || dpmsg.isEmpty() ? "0" : dpmsg);
        } catch (Exception ignored) {
        }
        if (dp != 0)
            return 0.0d;

        String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
        int perrInt = -1;
        try {
            perrInt = Integer.parseInt(perr == null || perr.isEmpty() ? "-1" : perr);
        } catch (Exception ignored) {
        }

        String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
        int perrLevelInt = 0;
        try {
            perrLevelInt = Integer.parseInt(perrLevel == null || perrLevel.isEmpty() ? "0" : perrLevel);
        } catch (Exception ignored) {
        }

        String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
        int isYunInt = 0;
        try {
            isYunInt = Integer.parseInt(isYun == null || isYun.isEmpty() ? "0" : isYun);
        } catch (Exception ignored) {
        }

        if (perrInt >= 0) {
            double base;
            switch (perrInt) {
                case 0:
                    base = 100.0;
                    break;
                case 1:
                    base = 60.0;
                    break;
                case 2:
                    base = 20.0;
                    break;
                case 3:
                    base = 0.0;
                    break;
                default:
                    base = 50.0;
                    break;
            }
            if (isYunInt == 1)
                base = Math.min(100.0, base + 0.0);

            double factor = 1.0;
            if (perrLevelInt >= 1)
                factor = 1.0 - (perrLevelInt - 1) * 0.12;
            double toneAdjusted = Math.max(0.0, Math.min(100.0, base * factor));
            return toneAdjusted;
        }

        if (fallbackPhoneScore > 0.0d)
            return fallbackPhoneScore;

        return 0.0d;
    }

    private JSONObject extractWordScoresFromElement(Element wordElem) {
        JSONObject out = new JSONObject();
        out.put("overall", 0);
        out.put("pronunciation", 0);
        out.put("tone", 0);
        out.put("duration", 0);
        out.put("completeness", 0);
        out.put("fluency", 0);

        if (wordElem == null)
            return out;

        NodeList phones = wordElem.getElementsByTagName("phone");

        double fallbackPhoneScore = getAttrDouble(wordElem, "phone_score", "phoneScore", "phone-score");

        double accPhoneScore = 0.0d;
        double accToneScore = 0.0d;
        int countPhoneScore = 0;
        int countToneScore = 0;
        int totalPhonesSeen = 0;
        int goodPhonesCount = 0;

        com.alibaba.fastjson.JSONArray phonemeArr = new com.alibaba.fastjson.JSONArray();

        Set<String> seenPhonemes = new HashSet<>();

        for (int i = 0; phones != null && i < phones.getLength(); i++) {
            Element ph = (Element) phones.item(i);

            String pContent = safeAttr(ph, "content", "p", "phoneme", "phone");
            if ((pContent == null || pContent.isEmpty()) && ph.getTextContent() != null)
                pContent = ph.getTextContent().trim();
            if (pContent == null)
                pContent = "";

            if ("sil".equalsIgnoreCase(pContent) || "silv".equalsIgnoreCase(pContent)) {
                continue;
            }

            double start = getAttrDouble(ph, "beg_pos", "begin", "start", "start_pos");
            String uniqueKey = pContent + "_" + start;
            if (seenPhonemes.contains(uniqueKey)) {
                continue;
            }
            seenPhonemes.add(uniqueKey);

            JSONObject p = new JSONObject();
            p.put("phoneme", pContent);
            String display = pContent == null ? "" : pContent.replaceAll("^_+", "").replaceAll("(.)\\1{1,}", "$1");
            p.put("phoneme_display", display);

            String monoTone = safeAttr(ph, "mono_tone", "mono_tone_msg", "mono-tone");
            p.put("mono_tone", monoTone == null ? "" : monoTone);

            double phScore = getAttrDouble(ph, "phone_score", "phoneme_score", "pronunciation", "pronunciation_score",
                    "score");
            if (phScore == 0.0d)
                phScore = computePhoneScoreForPhone(ph, fallbackPhoneScore);
            p.put("score", phScore);

            String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
            String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
            p.put("perr_msg", perr == null ? "" : perr);
            p.put("dp_message", dpmsg == null ? "" : dpmsg);

            double end = getAttrDouble(ph, "end_pos", "end", "time_len");
            p.put("start", start);
            p.put("end", end);

            double toneScore = getAttrDouble(ph, "tone_score", "tone", "mono_tone_score", "mono_tone");
            if (toneScore == 0.0d)
                toneScore = computeToneScoreForPhone(ph, wordElem, monoTone);
            p.put("tone_score", toneScore);

            String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
            String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
            p.put("perr_level_msg", perrLevel == null ? "" : perrLevel);
            p.put("is_yun", isYun == null ? "" : isYun);

            phonemeArr.add(p);

            totalPhonesSeen++;
            int dp = 0;
            try {
                dp = Integer.parseInt(dpmsg == null || dpmsg.isEmpty() ? "0" : dpmsg);
            } catch (Exception ignored) {
            }
            if (dp == 0) {
                if (phScore > 0.0d) {
                    accPhoneScore += phScore;
                    countPhoneScore++;
                }
                if (toneScore > 0.0d) {
                    accToneScore += toneScore;
                    countToneScore++;
                }
                goodPhonesCount++;
            }
        }

        out.put("phonemes", phonemeArr);

        double overall = 0.0d;
        double pron = 0.0d;
        double tone = 0.0d;
        double fluency = 0.0d;

        if (countPhoneScore > 0) {
            pron = Math.min(100.0, Math.max(0.0, accPhoneScore / countPhoneScore));
            overall = pron;
        } else if (fallbackPhoneScore > 0.0d) {
            pron = Math.min(100.0, fallbackPhoneScore);
            overall = pron;
        }

        if (countToneScore > 0)
            tone = Math.min(100.0, accToneScore / countToneScore);

        if (totalPhonesSeen > 0) {
            fluency = ((double) goodPhonesCount / (double) totalPhonesSeen) * 100.0;
        }

        double durMs = 0.0d;
        for (int i = 0; i < phonemeArr.size(); i++) {
            JSONObject p = phonemeArr.getJSONObject(i);
            double s = p.getDoubleValue("start");
            double e = p.getDoubleValue("end");
            if (e > s)
                durMs += (e - s);
        }

        out.put("overall", overall);
        out.put("pronunciation", pron);
        out.put("tone", tone);
        out.put("duration", durMs);

        NodeList sylls = wordElem.getElementsByTagName("syll");
        boolean anyBadSyll = false;
        for (int i = 0; i < sylls.getLength(); i++) {
            Element s = (Element) sylls.item(i);
            String dp = safeAttr(s, "dp_message", "dp_message", "dpmsg");
            int dpi = 0;
            try {
                dpi = Integer.parseInt(dp == null || dp.isEmpty() ? "0" : dp);
            } catch (Exception ignored) {
            }
            if (dpi != 0) {
                anyBadSyll = true;
                break;
            }
        }
        double completeness = anyBadSyll ? ((double) goodPhonesCount / Math.max(1, totalPhonesSeen) * 100.0) : 100.0;
        out.put("completeness", completeness);

        out.put("fluency", fluency);
        return out;
    }
}