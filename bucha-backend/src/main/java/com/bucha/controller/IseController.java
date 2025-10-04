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

        logger.info("Original text: {}", text);
        String normalizedText = normalizeText(text);
        logger.info("Normalized text: {}", normalizedText);

        JSONObject firstFrame = IseGlobalMessageBuilder.buildFirstFrame(
                appId, sub, defaultEnt, defaultCategory, normalizedText, "utf-8");
        String signedUrl = IseGlobalUrlSigner.generateSignedUrl(host, apiKey, apiSecret, requestPath);

        // shared, final wrappers for use inside lambdas / inner classes
        final AtomicReference<IseGlobalWebSocketClient> clientRef = new AtomicReference<>();
        final AtomicReference<String> sidRef = new AtomicReference<>();
        final AtomicReference<JSONObject> finalJsonRef = new AtomicReference<>();
        final AtomicBoolean resultEmitted = new AtomicBoolean(false);
        final AtomicBoolean streamCancelled = new AtomicBoolean(false);
        final AtomicReference<File> wavTempRef = new AtomicReference<>();
        final AtomicReference<Path> uploadedTempRef = new AtomicReference<>();

        CountDownLatch latch = new CountDownLatch(1);

        try {
            // 1) save upload to temp file
            Path uploadedTemp = Files.createTempFile("ise-upload-", getExtensionSafe(audioFile.getOriginalFilename()));
            try (InputStream in = audioFile.getInputStream()) {
                Files.copy(in, uploadedTemp, StandardCopyOption.REPLACE_EXISTING);
            }
            uploadedTempRef.set(uploadedTemp);

            // 2) ensure wav (ffmpeg or Java Sound fallback)
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
                return ResponseEntity.status(500).body(Map.of("error", "audio conversion failed", "detail", convEx.getMessage()));
            }

            // 3) prepare websocket client and start streaming wav
            IseGlobalWebSocketClient client = new IseGlobalWebSocketClient(signedUrl, new WebSocketListener() {
                @Override
                public void onOpen(WebSocket webSocket, Response response) {
                    logger.info("WebSocket opened");
                    // send first frame
                    try {
                        clientRef.get().sendJson(firstFrame);
                    } catch (Throwable e) {
                        logger.error("Failed to send first frame: {}", e.getMessage(), e);
                        streamCancelled.set(true);
                        latch.countDown();
                        return;
                    }

                    // stream audio in background thread
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
                                if (streamCancelled.get()) return;
                                try {
                                    com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSONObject.parseObject(jsonChunk);
                                    clientRef.get().sendJson(obj);
                                } catch (Throwable ex) {
                                    logger.error("Failed to parse/send JSON chunk: {}", ex.getMessage(), ex);
                                    streamCancelled.set(true);
                                }
                            };

                            IseFileStreamer.streamFile(wavToStream, sendJsonConsumer, appId, text, streamCancelled);
                            logger.info("Streaming finished, sent all chunks.");
                        } catch (Exception e) {
                            logger.error("Error while streaming audio file", e);
                            streamCancelled.set(true);
                            latch.countDown();
                        }
                    }, "ise-stream-thread").start();
                }

                @Override
                public void onMessage(WebSocket webSocket, String textMsg) {
                    logger.info("Received message: {}", textMsg);
                    try {
                        com.alibaba.fastjson.JSONObject resp = com.alibaba.fastjson.JSONObject.parseObject(textMsg);
                        int code = resp.getIntValue("code");

                        if (code != 0) {
                            logger.error("ISE returned error: {}", textMsg);
                            streamCancelled.set(true);
                            latch.countDown();
                            return;
                        }

                        String sid = resp.getString("sid");
                        if (sid != null && sidRef.get() == null) {
                            sidRef.set(sid);
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
                            logger.info("Intermediate response (status=1)");
                        } else if (status == 2) {
                            if (resultEmitted.compareAndSet(false, true)) {
                                if (base64Data != null && !base64Data.isEmpty()) {
                                    try {
                                        byte[] decoded = Base64.getDecoder().decode(base64Data);
                                        String xmlString = new String(decoded, StandardCharsets.UTF_8);
                                        logger.info("Decoded XML (first 500 chars): {}",
                                                xmlString.length() > 500 ? xmlString.substring(0, 500) : xmlString);
                                        Files.write(Path.of("result.xml"), decoded);

                                        Document doc = null;
                                        try {
                                            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                                            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                                            dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
                                            dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
                                            dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
                                            dbf.setXIncludeAware(false);
                                            dbf.setExpandEntityReferences(false);

                                            DocumentBuilder db = dbf.newDocumentBuilder();
                                            InputSource is = new InputSource(new StringReader(xmlString));
                                            is.setEncoding("UTF-8");
                                            doc = db.parse(is);
                                        } catch (Exception parseEx) {
                                            logger.error("Failed to parse XML: {}", parseEx.getMessage(), parseEx);
                                        }

                                        if (doc == null) {
                                            logger.error("Failed to parse XML result; cannot extract scores.");
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

                                            finalJson.put("sid", sidRef.get());
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

            // register client and connect
            clientRef.set(client);
            client.connect();

            // wait for result (best-effort timeout)
            latch.await(120, TimeUnit.SECONDS);
            try { client.close(); } catch (Exception ignore) {}
            logger.info("ISE interaction finished.");

            if (finalJsonRef.get() != null) {
                return ResponseEntity.ok(finalJsonRef.get().toJSONString());
            } else {
                return ResponseEntity.status(500).body(Collections.singletonMap("error", "no result from ISE"));
            }

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            logger.error("Interrupted while waiting for ISE", ie);
            return ResponseEntity.status(500).body(Map.of("error", "interrupted"));
        } catch (Exception ex) {
            logger.error("Unexpected error in score", ex);
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        } finally {
            // cleanup temp files
            try {
                File wavToDelete = wavTempRef.get();
                if (wavToDelete != null && wavToDelete.exists()) Files.deleteIfExists(wavToDelete.toPath());
            } catch (Exception ignored) {}
            try {
                Path uploadedPath = uploadedTempRef.get();
                if (uploadedPath != null) Files.deleteIfExists(uploadedPath);
            } catch (Exception ignored) {}
        }
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text
                .replace("!", "！")
                .replace("?", "？")
                .replace(",", "，")
                .replace(".", "。")
                .replace(";", "；")
                .replace(":", "：")
                .trim();
    }

    // -------------------- Conversion helpers --------------------

    /**
     * Convert arbitrary audio file (webm/ogg/...) -> WAV (PCM 16-bit LE) using ffmpeg.
     * Returns a temp File pointing to the WAV output (caller phải xóa sau dùng).
     *
     * Throws IOException / InterruptedException on failure.
     */
    private File convertToWavWithFfmpeg(File inputFile) throws IOException, InterruptedException {
        String ffmpegPath = System.getenv().getOrDefault("FFMPEG_PATH", "ffmpeg");

        Path out = Files.createTempFile("ise-out-", ".wav");
        File outFile = out.toFile();

        ProcessBuilder pb = new ProcessBuilder(
                ffmpegPath,
                "-y",
                "-i", inputFile.getAbsolutePath(),
                "-ar", "16000",
                "-ac", "1",
                "-sample_fmt", "s16",
                outFile.getAbsolutePath()
        );
        pb.redirectErrorStream(true);

        Process p = pb.start();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line;
            while ((line = br.readLine()) != null) {
                logger.debug("ffmpeg: {}", line);
            }
        }

        boolean finished = p.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            throw new IOException("ffmpeg timeout (killed)");
        }
        int exit = p.exitValue();
        if (exit != 0) {
            throw new IOException("ffmpeg failed, exit code=" + exit);
        }
        if (!outFile.exists() || outFile.length() == 0) {
            throw new IOException("ffmpeg produced empty output");
        }
        return outFile;
    }

    /**
     * If file already wav -> copy and return.
     * If webm/ogg/mp3 -> try ffmpeg.
     * Else try Java Sound fallback.
     */
    private File ensureWavFile(Path uploadedTempFile, String originalFilename, String contentType) throws Exception {
        String lowerName = originalFilename == null ? "" : originalFilename.toLowerCase();
        String ct = contentType == null ? "" : contentType.toLowerCase();

        if (lowerName.endsWith(".wav") || ct.contains("wav")) {
            Path wavCopy = Files.createTempFile("ise-wav-", ".wav");
            Files.copy(uploadedTempFile, wavCopy, StandardCopyOption.REPLACE_EXISTING);
            return wavCopy.toFile();
        }

        if (lowerName.endsWith(".webm") || ct.contains("webm") ||
                lowerName.endsWith(".ogg") || ct.contains("ogg") ||
                lowerName.endsWith(".opus") || ct.contains("opus") ||
                lowerName.endsWith(".mp3") || ct.contains("mp3")) {
            try {
                return convertToWavWithFfmpeg(uploadedTempFile.toFile());
            } catch (IOException | InterruptedException e) {
                logger.error("ffmpeg conversion failed: {}", e.getMessage(), e);
                throw e;
            }
        }

        // Java Sound fallback (works only for formats Java can decode)
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
            AudioFormat targetFormat = new AudioFormat(
                    AudioFormat.Encoding.PCM_SIGNED,
                    sourceFormat.getSampleRate(),
                    16,
                    sourceFormat.getChannels(),
                    sourceFormat.getChannels() * 2,
                    sourceFormat.getSampleRate(),
                    false
            );

            AudioInputStream pcmAis;
            if (AudioSystem.isConversionSupported(targetFormat, sourceFormat)) {
                pcmAis = AudioSystem.getAudioInputStream(targetFormat, sourceAis);
            } else if (sourceFormat.getEncoding().equals(AudioFormat.Encoding.PCM_SIGNED)
                    && sourceFormat.getSampleSizeInBits() == 16
                    && !sourceFormat.isBigEndian()) {
                pcmAis = sourceAis;
            } else {
                throw new UnsupportedAudioFileException("Java Sound cannot convert format: " + sourceFormat);
            }

            AudioSystem.write(pcmAis, AudioFileFormat.Type.WAVE, outTemp.toFile());
            return outTemp.toFile();
        }
    }

    private String getExtensionSafe(String filename) {
        if (filename == null) return ".tmp";
        int i = filename.lastIndexOf('.');
        if (i < 0) return ".tmp";
        String ext = filename.substring(i);
        if (ext.matches("\\.[A-Za-z0-9]+")) return ext;
        return ".tmp";
    }
}
