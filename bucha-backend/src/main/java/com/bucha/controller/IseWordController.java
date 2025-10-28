//package com.bucha.controller;
//
//import com.alibaba.fastjson.JSONObject;
//import com.bucha.pronunciation.IseFileStreamer;
//import com.bucha.pronunciation.IseGlobalUrlSigner;
//import com.bucha.pronunciation.IseGlobalWebSocketClient;
//import okhttp3.Response;
//import okhttp3.WebSocket;
//import okhttp3.WebSocketListener;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//import org.w3c.dom.*;
//import org.xml.sax.InputSource;
//
//import javax.sound.sampled.*;
//import javax.xml.parsers.DocumentBuilder;
//import javax.xml.parsers.DocumentBuilderFactory;
//import java.io.*;
//import java.nio.charset.StandardCharsets;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.StandardCopyOption;
//import java.util.*;
//import java.util.Base64;
//import java.util.concurrent.CountDownLatch;
//import java.util.concurrent.TimeUnit;
//import java.util.concurrent.atomic.AtomicBoolean;
//import java.util.concurrent.atomic.AtomicReference;
//
//@RestController
//@RequestMapping("/api/ise")
//public class IseWordController {
//    private static final Logger logger = LoggerFactory.getLogger(IseWordController.class);
//
//    @Value("${iflytek.app-id}")
//    private String appId;
//    @Value("${iflytek.api-key}")
//    private String apiKey;
//    @Value("${iflytek.api-secret}")
//    private String apiSecret;
//    @Value("${iflytek.ent:cn_vip}")
//    private String defaultEnt;
//    @Value("${iflytek.category:read_sentence}")
//    private String defaultCategory;
//    @Value("${iflytek.sub}")
//    private String sub;
//    String host = "ise-api-sg.xf-yun.com";
//    String requestPath = "/v2/ise";
//
//    /**
//     * Endpoint: score a single *word* (core = "word").
//     */
//    @PostMapping(value = "/score/word", consumes = "multipart/form-data")
//    public ResponseEntity<?> scoreWord(@RequestPart("text") String text,
//                                       @RequestPart("audio") MultipartFile audioFile) throws Exception {
//        logger.info("Received word-score upload: name={} size={} contentType={}",
//                audioFile == null ? null : audioFile.getOriginalFilename(),
//                audioFile == null ? null : audioFile.getSize(),
//                audioFile == null ? null : audioFile.getContentType());
//
//        if (audioFile == null || audioFile.isEmpty()) {
//            return ResponseEntity.badRequest().body(Map.of(
//                    "error", "audio file is empty or missing",
//                    "hint", "Use form-data with key 'audio' as File"
//            ));
//        }
//
//        String normalizedText = normalizeText(text);
//        logger.info("Word to score: {} -> {}", text, normalizedText);
//
//        // Use AtomicReference for firstFrame so it can be accessed from inner classes
//        final AtomicReference<JSONObject> firstFrameRef = new AtomicReference<>();
//        try {
//            JSONObject built = com.bucha.pronunciation.IseGlobalMessageBuilder.buildFirstFrame(
//                    appId, sub, defaultEnt, defaultCategory, normalizedText, "utf-8");
//
//            // --- IMPORTANT: Do NOT blindly inject a top-level "parameter" object if the builder doesn't use it.
//            // Some builds of the SDK return a different structure; adding a new top-level "parameter" can trigger
//            // server validation errors like: "unknown field $.parameter;". Here we only mutate the returned frame
//            // if it already contains a modifiable 'parameter'-style object. Otherwise we leave it unchanged and
//            // log what we got so it can be inspected.
//
//            if (built.containsKey("parameter")) {
//                try {
//                    JSONObject parameter = built.getJSONObject("parameter");
//                    if (parameter == null) {
//                        parameter = new JSONObject();
//                        built.put("parameter", parameter);
//                    }
//                    JSONObject st = parameter.getJSONObject("st");
//                    if (st == null) {
//                        st = new JSONObject();
//                        parameter.put("st", st);
//                    }
//                    st.put("core", "word");
//                    st.put("phoneme_output", "1");
//                    st.put("ref_text", normalizedText);
//                    st.put("refText", normalizedText);
//                } catch (Throwable t) {
//                    logger.warn("Could not safely modify built.firstFrame.parameter: {}", t.getMessage());
//                }
//            } else if (built.containsKey("params")) {
//                // alternative key commonly used by some SDKs
//                try {
//                    JSONObject parameter = built.getJSONObject("params");
//                    if (parameter == null) {
//                        parameter = new JSONObject();
//                        built.put("params", parameter);
//                    }
//                    JSONObject st = parameter.getJSONObject("st");
//                    if (st == null) {
//                        st = new JSONObject();
//                        parameter.put("st", st);
//                    }
//                    st.put("core", "word");
//                    st.put("phoneme_output", "1");
//                    st.put("ref_text", normalizedText);
//                    st.put("refText", normalizedText);
//                } catch (Throwable t) {
//                    logger.warn("Could not safely modify built.params: {}", t.getMessage());
//                }
//            } else {
//                // builder returned something unexpected -> do not inject new top-level fields (avoids server-side validation errors)
//                logger.warn("Builder firstFrame has no 'parameter' or 'params' key; will not inject 'parameter' to avoid server validation errors. firstFrame: {}",
//                        built.toJSONString());
//            }
//
//            firstFrameRef.set(built);
//        } catch (Throwable e) {
//            logger.error("Failed to build firstFrame using builder; aborting to avoid sending malformed frame: {}", e.getMessage());
//            return ResponseEntity.status(500).body(Map.of("error", "failed to build ISE first frame", "detail", e.getMessage()));
//        }
//
//        String signedUrl = IseGlobalUrlSigner.generateSignedUrl(host, apiKey, apiSecret, requestPath);
//
//        final AtomicReference<IseGlobalWebSocketClient> clientRef = new AtomicReference<>();
//        final AtomicReference<String> sidRef = new AtomicReference<>();
//        final AtomicReference<JSONObject> finalJsonRef = new AtomicReference<>();
//        final AtomicBoolean resultEmitted = new AtomicBoolean(false);
//        final AtomicBoolean streamCancelled = new AtomicBoolean(false);
//        final AtomicReference<File> wavTempRef = new AtomicReference<>();
//        final AtomicReference<Path> uploadedTempRef = new AtomicReference<>();
//
//        CountDownLatch latch = new CountDownLatch(1);
//
//        try {
//            // save upload
//            Path uploadedTemp = Files.createTempFile("ise-upload-word-", getExtensionSafe(audioFile.getOriginalFilename()));
//            try (InputStream in = audioFile.getInputStream()) {
//                Files.copy(in, uploadedTemp, StandardCopyOption.REPLACE_EXISTING);
//            }
//            uploadedTempRef.set(uploadedTemp);
//
//            // ensure wav
//            File wavFile = ensureWavFile(uploadedTemp, audioFile.getOriginalFilename(), audioFile.getContentType());
//            wavTempRef.set(wavFile);
//
//            IseGlobalWebSocketClient client = new IseGlobalWebSocketClient(signedUrl, new WebSocketListener() {
//                @Override
//                public void onOpen(WebSocket webSocket, Response response) {
//                    logger.info("WebSocket opened (word)");
//                    try {
//                        // debug: log exact first-frame being sent
//                        JSONObject frameToSend = firstFrameRef.get();
//                        if (frameToSend != null) {
//                            logger.debug("Sending firstFrame: {}", frameToSend.toJSONString());
//                        }
//
//                        clientRef.get().sendJson(frameToSend);
//                    } catch (Throwable e) {
//                        logger.error("Failed to send first frame: {}", e.getMessage(), e);
//                        streamCancelled.set(true);
//                        latch.countDown();
//                        return;
//                    }
//
//                    new Thread(() -> {
//                        try {
//                            File wavToStream = wavTempRef.get();
//                            if (wavToStream == null) {
//                                streamCancelled.set(true);
//                                latch.countDown();
//                                return;
//                            }
//
//                            java.util.function.Consumer<String> sendJsonConsumer = jsonChunk -> {
//                                if (streamCancelled.get()) return;
//                                try {
//                                    com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSONObject.parseObject(jsonChunk);
//                                    clientRef.get().sendJson(obj);
//                                } catch (Throwable ex) {
//                                    logger.error("Failed to parse/send JSON chunk: {}", ex.getMessage(), ex);
//                                    streamCancelled.set(true);
//                                }
//                            };
//
//                            IseFileStreamer.streamFile(wavToStream, sendJsonConsumer, appId, text, streamCancelled);
//                            logger.info("Streaming finished (word)");
//                        } catch (Exception e) {
//                            logger.error("Error while streaming audio file (word)", e);
//                            streamCancelled.set(true);
//                            latch.countDown();
//                        }
//                    }, "ise-stream-word-thread").start();
//                }
//
//                @Override
//                public void onMessage(WebSocket webSocket, String textMsg) {
//                    logger.info("Received message (word): {}", textMsg);
//                    try {
//                        com.alibaba.fastjson.JSONObject resp = com.alibaba.fastjson.JSONObject.parseObject(textMsg);
//                        int code = resp.getIntValue("code");
//                        if (code != 0) {
//                            logger.error("ISE returned error: {}", textMsg);
//                            streamCancelled.set(true);
//                            latch.countDown();
//                            return;
//                        }
//
//                        String sid = resp.getString("sid");
//                        if (sid != null && sidRef.get() == null) sidRef.set(sid);
//
//                        com.alibaba.fastjson.JSONObject dataObj = resp.getJSONObject("data");
//                        if (dataObj == null) return;
//
//                        int status = dataObj.getIntValue("status");
//                        String base64Data = dataObj.getString("data");
//
//                        if (status == 2) {
//                            if (resultEmitted.compareAndSet(false, true)) {
//                                if (base64Data != null && !base64Data.isEmpty()) {
//                                    try {
//                                        byte[] decoded = Base64.getDecoder().decode(base64Data);
//                                        String xmlString = new String(decoded, StandardCharsets.UTF_8);
//                                        Files.write(Path.of("result-word.xml"), decoded);
//
//                                        Document doc = parseXmlSafely(xmlString);
//                                        if (doc == null) {
//                                            logger.error("Failed to parse XML result (word)");
//                                        } else {
//                                            JSONObject out = extractWordScores(doc);
//                                            out.put("sid", sidRef.get());
//                                            out.put("status", 2);
//                                            finalJsonRef.set(out);
//                                        }
//                                    } catch (IllegalArgumentException iae) {
//                                        logger.warn("Failed to Base64-decode data field; logging raw response. err={}", iae.getMessage());
//                                        logger.info("Final result (raw): {}", textMsg);
//                                    }
//                                }
//                            }
//                            latch.countDown();
//                        }
//
//                    } catch (Throwable e) {
//                        logger.error("Failed to parse onMessage JSON (word): {}, err: {}", textMsg, e.getMessage(), e);
//                    }
//                }
//
//                @Override
//                public void onClosed(WebSocket webSocket, int code, String reason) {
//                    logger.info("WebSocket closed (word): {} {}", code, reason);
//                    streamCancelled.set(true);
//                    latch.countDown();
//                }
//
//                @Override
//                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
//                    logger.error("WebSocket error (word)", t);
//                    streamCancelled.set(true);
//                    latch.countDown();
//                }
//            });
//
//            clientRef.set(client);
//            client.connect();
//
//            latch.await(120, TimeUnit.SECONDS);
//            try { client.close(); } catch (Exception ignore) {}
//
//            if (finalJsonRef.get() != null) {
//                return ResponseEntity.ok(finalJsonRef.get().toJSONString());
//            } else {
//                return ResponseEntity.status(500).body(Collections.singletonMap("error", "no result from ISE (word)"));
//            }
//
//        } catch (InterruptedException ie) {
//            Thread.currentThread().interrupt();
//            logger.error("Interrupted while waiting for ISE (word)", ie);
//            return ResponseEntity.status(500).body(Map.of("error", "interrupted"));
//        } catch (Exception ex) {
//            logger.error("Unexpected error in scoreWord", ex);
//            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
//        } finally {
//            try { File wavToDelete = wavTempRef.get(); if (wavToDelete != null && wavToDelete.exists()) Files.deleteIfExists(wavToDelete.toPath()); } catch (Exception ignored) {}
//            try { Path uploadedPath = uploadedTempRef.get(); if (uploadedPath != null) Files.deleteIfExists(uploadedPath); } catch (Exception ignored) {}
//        }
//    }
//
//    // -------------------- helpers --------------------
//
//    private Document parseXmlSafely(String xmlString) {
//        try {
//            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
//            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
//            dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
//            dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
//            dbf.setXIncludeAware(false);
//            dbf.setExpandEntityReferences(false);
//
//            DocumentBuilder db = dbf.newDocumentBuilder();
//            InputSource is = new InputSource(new StringReader(xmlString));
//            is.setEncoding("UTF-8");
//            return db.parse(is);
//        } catch (Exception e) {
//            logger.error("XML parse error: {}", e.getMessage(), e);
//            return null;
//        }
//    }
//
//    private JSONObject extractWordScores(Document doc) {
//        // Prefer high-level read_sentence (where total_score / phone_score typically live).
//        Element readSentence = null;
//        NodeList rsList = doc.getElementsByTagName("read_sentence");
//        if (rsList != null && rsList.getLength() > 0) {
//            // pick the last read_sentence that contains scoring attributes if possible
//            for (int i = rsList.getLength() - 1; i >= 0; i--) {
//                Element cand = (Element) rsList.item(i);
//                if (cand.hasAttribute("total_score") || cand.hasAttribute("phone_score") || cand.hasAttribute("fluency_score")) {
//                    readSentence = cand;
//                    break;
//                }
//            }
//            if (readSentence == null) readSentence = (Element) rsList.item(0);
//        }
//
//        // find first <word> element (phonemes are usually under <word>)
//        Element wordElem = null;
//        NodeList wn = doc.getElementsByTagName("word");
//        if (wn != null && wn.getLength() > 0) wordElem = (Element) wn.item(0);
//
//        JSONObject out = new JSONObject();
//        out.put("overall", 0);
//        out.put("pronunciation", 0);
//        out.put("tone", 0);
//        out.put("duration", 0);
//        out.put("completeness", 0);
//        out.put("fluency", 0);
//
//        // If we have a read_sentence with the scores, prefer those
//        if (readSentence != null) {
//            out.put("overall", getAttrDouble(readSentence, "total_score", "overall_score", "score"));
//            out.put("pronunciation", getAttrDouble(readSentence, "phone_score", "pronunciation_score", "pronunciation"));
//            out.put("tone", getAttrDouble(readSentence, "tone_score", "tone"));
//            out.put("duration", getAttrDouble(readSentence, "time_len", "duration"));
//            out.put("completeness", getAttrDouble(readSentence, "integrity_score", "completeness", "accuracy_score"));
//            out.put("fluency", getAttrDouble(readSentence, "fluency_score"));
//        } else if (wordElem != null) {
//            // fallback: some responses may place sentence-level scores on the parent <sentence>
//            Node parent = wordElem.getParentNode();
//            if (parent instanceof Element) {
//                Element par = (Element) parent;
//                out.put("overall", getAttrDouble(par, "total_score", "overall_score", "score"));
//                out.put("pronunciation", getAttrDouble(par, "phone_score", "pronunciation_score", "pronunciation"));
//                out.put("tone", getAttrDouble(par, "tone_score", "tone"));
//                out.put("duration", getAttrDouble(par, "time_len", "duration"));
//                out.put("completeness", getAttrDouble(par, "integrity_score", "completeness", "accuracy_score"));
//                out.put("fluency", getAttrDouble(par, "fluency_score"));
//            }
//        }
//
//        com.alibaba.fastjson.JSONArray phonemeArr = new com.alibaba.fastjson.JSONArray();
//        NodeList phones = null;
//        if (wordElem != null) phones = wordElem.getElementsByTagName("phone");
//        if (phones == null || phones.getLength() == 0) {
//            // try any <phone> in document
//            phones = doc.getElementsByTagName("phone");
//        }
//
//        // try to get a fallback phone_score from parent (some XMLs put a phone_score on the word/sentence)
//        double fallbackPhoneScore = 0.0d;
//        if (wordElem != null) {
//            fallbackPhoneScore = getAttrDouble(wordElem, "phone_score", "phoneScore", "phone-score");
//            if (fallbackPhoneScore == 0.0d) {
//                Node parent = wordElem.getParentNode();
//                if (parent instanceof Element) {
//                    fallbackPhoneScore = getAttrDouble((Element) parent, "phone_score", "phoneScore", "phone-score");
//                }
//            }
//        }
//
//        for (int i = 0; phones != null && i < phones.getLength(); i++) {
//            Element ph = (Element) phones.item(i);
//            JSONObject p = new JSONObject();
//
//            // phoneme text: many variants -> content, p, phoneme, textContent
//            String pContent = safeAttr(ph, "content", "p", "phoneme", "phone");
//            if ((pContent == null || pContent.isEmpty()) && ph.getTextContent() != null) {
//                pContent = ph.getTextContent().trim();
//            }
//            p.put("phoneme", pContent == null ? "" : pContent);
//
//            // score: try many attribute names then fallback to parent's phone_score
//            double phScore = getAttrDouble(ph, "phone_score", "phoneme_score", "pronunciation", "pronunciation_score", "score");
//            if (phScore == 0.0d && fallbackPhoneScore > 0.0d) phScore = fallbackPhoneScore;
//            p.put("score", phScore);
//
//            // perr / dp messages (diagnostic codes); keep whatever present
//            String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
//            String dpmsg = safeAttr(ph, "dp_message", "dp_message", "dpmsg", "dp-message");
//            String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
//            String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
//
//            p.put("perr_msg", perr == null ? "" : perr);
//            p.put("dp_message", dpmsg == null ? "" : dpmsg);
//            p.put("perr_level_msg", perrLevel == null ? "" : perrLevel);
//            p.put("is_yun", isYun == null ? "" : isYun);
//
//            // start/end: try variants (beg_pos, begin, start, start_pos, end_pos, end, time_len)
//            double start = getAttrDouble(ph, "beg_pos", "begin", "start", "start_pos");
//            double end = getAttrDouble(ph, "end_pos", "end", "time_len");
//            p.put("start", start);
//            p.put("end", end);
//
//            // --- compute tone_score for this phone (prefer explicit, else heuristic using perr/dp/is_yun)
//            double toneScore = computeToneScoreForPhone(ph, wordElem);
//            p.put("tone_score", toneScore);
//
//            phonemeArr.add(p);
//        }
//        out.put("phonemes", phonemeArr);
//
//        return out;
//    }
//
//    /**
//     * Compute a tone score (0..100) for a phone Element.
//     * Logic:
//     *  - if explicit numeric tone_score / tone present on phone -> use it
//     *  - else if dp_message != 0 -> 0 (missing/inserted/readback)
//     *  - else if perr_msg present:
//     *        if is_yun==1 (rhyme/vowel) -> map perr_msg to base (0:100,1:60,2:20,3:0)
//     *        else (consonant) -> base 100 if perr_msg==0 else 50
//     *     scale by perr_level_msg (small penalty)
//     *  - else fallback to phone/word tone_score if present
//     */
//    private double computeToneScoreForPhone(Element ph, Element wordElem) {
//        // prefer explicit numeric tone
//        double explicitTone = getAttrDouble(ph, "tone_score", "tone", "mono_tone_score", "mono_tone");
//        if (explicitTone > 0.0d) return explicitTone;
//
//        String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
//        int dp = 0;
//        try { dp = Integer.parseInt(dpmsg == null ? "0" : dpmsg); } catch (Exception ignored) {}
//
//        if (dp != 0) {
//            // insertion/missing/readback -> tone meaningless
//            return 0.0d;
//        }
//
//        String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
//        int perrInt = -1;
//        try { perrInt = Integer.parseInt(perr == null ? "-1" : perr); } catch (Exception ignored) {}
//
//        String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
//        int perrLevelInt = 0;
//        try { perrLevelInt = Integer.parseInt(perrLevel == null ? "0" : perrLevel); } catch (Exception ignored) {}
//
//        String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
//        int isYunInt = 0;
//        try { isYunInt = Integer.parseInt(isYun == null ? "0" : isYun); } catch (Exception ignored) {}
//
//        if (perrInt >= 0) {
//            double base;
//            if (isYunInt == 1) {
//                // vowel/rhyme: perr_msg likely encodes tone/rhyme correctness
//                switch (perrInt) {
//                    case 0: base = 100.0; break; // correct
//                    case 1: base = 60.0;  break; // rhyme error
//                    case 2: base = 20.0;  break; // tone error
//                    case 3: base = 0.0;   break; // both wrong
//                    default: base = 50.0; break;
//                }
//            } else {
//                base = (perrInt == 0) ? 100.0 : 50.0;
//            }
//            double factor = 1.0;
//            if (perrLevelInt >= 1) factor = 1.0 - (perrLevelInt - 1) * 0.15; // small penalty for larger level
//            double toneScore = Math.max(0.0, Math.min(100.0, base * factor));
//            return toneScore;
//        }
//
//        // fallback: try phone/word tone_score
//        double fallback = getAttrDouble(ph, "phone_score", "tone_score", "tone");
//        if (fallback > 0.0d) return fallback;
//        if (wordElem != null) {
//            double wfb = getAttrDouble(wordElem, "tone_score", "phone_score", "phoneScore");
//            if (wfb > 0.0d) return wfb;
//        }
//        return 0.0d;
//    }
//
//    private double getAttrDouble(Element e, String... keys) {
//        for (String k : keys) {
//            try {
//                String v = e.getAttribute(k);
//                if (v != null && !v.isEmpty()) return Double.parseDouble(v);
//            } catch (Exception ignored) {}
//        }
//        return 0.0d;
//    }
//
//    private String normalizeText(String text) {
//        if (text == null) return "";
//        return text.replace("!", "！").replace("?", "？").replace(",", "，").replace(".", "。")
//                .replace(";", "；").replace(":", "：").trim();
//    }
//
//    // reuse conversion helpers (similar to existing controller)
//    private File convertToWavWithFfmpeg(File inputFile) throws IOException, InterruptedException {
//        String ffmpegPath = System.getenv().getOrDefault("FFMPEG_PATH", "ffmpeg");
//        Path out = Files.createTempFile("ise-out-word-", ".wav");
//        File outFile = out.toFile();
//        ProcessBuilder pb = new ProcessBuilder(ffmpegPath, "-y", "-i", inputFile.getAbsolutePath(), "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", outFile.getAbsolutePath());
//        pb.redirectErrorStream(true);
//        Process p = pb.start();
//        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
//            String line; while ((line = br.readLine()) != null) logger.debug("ffmpeg: {}", line);
//        }
//        boolean finished = p.waitFor(30, TimeUnit.SECONDS);
//        if (!finished) { p.destroyForcibly(); throw new IOException("ffmpeg timeout (killed)"); }
//        int exit = p.exitValue(); if (exit != 0) throw new IOException("ffmpeg failed, exit code=" + exit);
//        if (!outFile.exists() || outFile.length() == 0) throw new IOException("ffmpeg produced empty output");
//        return outFile;
//    }
//
//    private File ensureWavFile(Path uploadedTempFile, String originalFilename, String contentType) throws Exception {
//        String lowerName = originalFilename == null ? "" : originalFilename.toLowerCase();
//        String ct = contentType == null ? "" : contentType.toLowerCase();
//
//        if (lowerName.endsWith(".wav") || ct.contains("wav")) {
//            Path wavCopy = Files.createTempFile("ise-wav-word-", ".wav");
//            Files.copy(uploadedTempFile, wavCopy, StandardCopyOption.REPLACE_EXISTING);
//            return wavCopy.toFile();
//        }
//
//        if (lowerName.endsWith(".webm") || ct.contains("webm") || lowerName.endsWith(".ogg") || ct.contains("ogg") || lowerName.endsWith(".opus") || ct.contains("opus") || lowerName.endsWith(".mp3") || ct.contains("mp3")) {
//            try { return convertToWavWithFfmpeg(uploadedTempFile.toFile()); }
//            catch (IOException | InterruptedException e) { logger.error("ffmpeg conversion failed: {}", e.getMessage(), e); throw e; }
//        }
//
//        try { return convertUsingJavaSound(uploadedTempFile.toFile()); }
//        catch (UnsupportedAudioFileException uafe) { logger.warn("JavaSound cannot decode uploaded file: {}", uafe.getMessage()); throw uafe; }
//    }
//
//    private File convertUsingJavaSound(File inputFile) throws IOException, UnsupportedAudioFileException {
//        Path outTemp = Files.createTempFile("ise-out-js-word-", ".wav");
//        try (AudioInputStream sourceAis = AudioSystem.getAudioInputStream(inputFile)) {
//            AudioFormat sourceFormat = sourceAis.getFormat();
//            AudioFormat targetFormat = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED, sourceFormat.getSampleRate(), 16, sourceFormat.getChannels(), sourceFormat.getChannels() * 2, sourceFormat.getSampleRate(), false);
//            AudioInputStream pcmAis;
//            if (AudioSystem.isConversionSupported(targetFormat, sourceFormat)) pcmAis = AudioSystem.getAudioInputStream(targetFormat, sourceAis);
//            else if (sourceFormat.getEncoding().equals(AudioFormat.Encoding.PCM_SIGNED) && sourceFormat.getSampleSizeInBits() == 16 && !sourceFormat.isBigEndian()) pcmAis = sourceAis;
//            else throw new UnsupportedAudioFileException("Java Sound cannot convert format: " + sourceFormat);
//            AudioSystem.write(pcmAis, AudioFileFormat.Type.WAVE, outTemp.toFile());
//            return outTemp.toFile();
//        }
//    }
//
//    private String getExtensionSafe(String filename) {
//        if (filename == null) return ".tmp";
//        int i = filename.lastIndexOf('.'); if (i < 0) return ".tmp";
//        String ext = filename.substring(i);
//        if (ext.matches("\\.[A-Za-z0-9]+")) {
//            return ext;
//        }
//        return ".tmp";
//    }
//
//    private String safeAttr(Element e, String... names) {
//        for (String n : names) {
//            try {
//                String v = e.getAttribute(n);
//                if (v != null && !v.isEmpty()) return v;
//            } catch (Exception ignored) {}
//        }
//        return null;
//    }
//}
