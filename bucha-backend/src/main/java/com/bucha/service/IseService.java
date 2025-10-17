package com.bucha.service;

import com.alibaba.fastjson.JSONObject;
import com.bucha.controller.IseController;
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
import org.springframework.beans.factory.annotation.Autowired;
import com.bucha.repository.IseRepository;
import com.bucha.repository.UserRepository;
import com.bucha.entity.IseScore;
import com.bucha.security.JwtUserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class IseService {
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

    @Autowired
    IseRepository iseRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    com.bucha.repository.IseDailyEntryRepository iseDailyEntryRepository;

    @Autowired
    com.bucha.repository.IseLessonEntryRepository iseLessonEntryRepository;

    @Autowired
    com.bucha.repository.IseTestEntryRepository iseTestEntryRepository;

    public ResponseEntity<?> score(JwtUserPrincipal principal, String text, MultipartFile audioFile, String reqSub,
            String reqEnt, String scoreCategory, Long lessonId, Long testId, Boolean includeInDaily,
            String sessionDate, Double durationSeconds, Integer numSentences, String lineId, String vocabularyId,
            String source)
            throws Exception {
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

                                            // Check if sentence was marked rejected by ISE. If so,
                                            // preserve sentence-level scores and do not attempt to
                                            // recompute/override them using word/phone-level details.
                                            boolean sentenceRejected = false;
                                            String sentenceExceptInfo = null;
                                            if (readSentence != null) {
                                                String isRejectedAttr = readSentence.getAttribute("is_rejected");
                                                sentenceExceptInfo = readSentence.getAttribute("except_info");
                                                if (isRejectedAttr != null && !isRejectedAttr.isEmpty()
                                                        && ("true".equalsIgnoreCase(isRejectedAttr)
                                                                || "1".equals(isRejectedAttr))) {
                                                    sentenceRejected = true;
                                                }
                                            }

                                            if (sentenceRejected) {
                                                sentenceOut.put("is_rejected", true);
                                                if (sentenceExceptInfo != null && !sentenceExceptInfo.isEmpty())
                                                    sentenceOut.put("except_info", sentenceExceptInfo);
                                                sentenceOut.put("warning",
                                                        "Recording quality too poor (Error "
                                                                + (sentenceExceptInfo == null ? "unknown"
                                                                        : sentenceExceptInfo)
                                                                + "). Please try again with a longer, clearer recording.");
                                                // Do not compute wrong_words from word-level scores when rejected
                                                sentenceOut.put("wrong_words", new com.alibaba.fastjson.JSONArray());
                                            } else {
                                                // Build wrong_words based solely on the word-level "overall" score.
                                                // Assumption: consider a word wrong when its overall <
                                                // WRONG_WORD_THRESHOLD.
                                                java.util.List<String> wrongList = new java.util.ArrayList<>();
                                                final double WRONG_WORD_THRESHOLD = 60.0d;
                                                if (readSentence != null) {
                                                    NodeList words = readSentence.getElementsByTagName("word");
                                                    for (int wi = 0; words != null && wi < words.getLength(); wi++) {
                                                        Element w = (Element) words.item(wi);
                                                        String content = w.getAttribute("content");
                                                        if (content == null || content.isEmpty()) {
                                                            content = w.getTextContent() == null ? ""
                                                                    : w.getTextContent().trim();
                                                        }
                                                        if (content == null || content.isEmpty())
                                                            continue;

                                                        double overall = 0.0d;
                                                        try {
                                                            JSONObject wordScores = extractWordScoresFromElement(w);
                                                            if (wordScores != null && wordScores.containsKey("overall"))
                                                                overall = wordScores.getDoubleValue("overall");
                                                        } catch (Throwable t) {
                                                            logger.warn("Failed to extract word score for '{}': {}",
                                                                    content, t.getMessage());
                                                        }

                                                        // Fallback: if extractor didn't return an overall, try
                                                        // attributes
                                                        // on the element or parent
                                                        if (overall == 0.0d) {
                                                            String s = w.getAttribute("total_score");
                                                            if (s == null || s.isEmpty()) {
                                                                Node parent = w.getParentNode();
                                                                if (parent instanceof Element) {
                                                                    s = ((Element) parent).getAttribute("total_score");
                                                                }
                                                            }
                                                            if (s != null && !s.isEmpty()) {
                                                                try {
                                                                    overall = Double.parseDouble(s);
                                                                } catch (Exception ignored) {
                                                                }
                                                            }
                                                        }

                                                        if (overall < WRONG_WORD_THRESHOLD) {
                                                            wrongList.add(content);
                                                        }
                                                    }
                                                }
                                                com.alibaba.fastjson.JSONArray wrongArr = new com.alibaba.fastjson.JSONArray();
                                                for (String s : wrongList)
                                                    wrongArr.add(s);
                                                sentenceOut.put("wrong_words", wrongArr);
                                            }

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
            boolean sentenceRejected = false;
            if (doc != null) {
                NodeList rsList = doc.getElementsByTagName("read_sentence");
                Element readSentence = null;
                if (rsList != null && rsList.getLength() > 0)
                    readSentence = (Element) rsList.item(0);
                if (readSentence != null) {
                    words = readSentence.getElementsByTagName("word");
                    String isRejectedAttr = readSentence.getAttribute("is_rejected");
                    if (isRejectedAttr != null
                            && ("true".equalsIgnoreCase(isRejectedAttr) || "1".equals(isRejectedAttr))) {
                        sentenceRejected = true;
                    }
                }
                if (words == null || words.getLength() == 0)
                    words = doc.getElementsByTagName("word");
            }

            if (sentenceRejected) {
                // When sentence is rejected, skip per-word re-scoring to avoid
                // recomputing a misleading sentence total. Return an empty words
                // array and mark the response accordingly.
                logger.info("ISE marked sentence as rejected; skipping per-word scoring to preserve sentence totals.");
            } else if (words != null && words.getLength() > 0) {
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

            // Persist attempt to DB if user present
            try {
                IseScore score = new IseScore();
                score.setTotalScore(sentenceResult.getDoubleValue("total_score"));
                // map fields: fluency/completeness if available
                if (sentenceResult.containsKey("fluency"))
                    score.setFluency(sentenceResult.getDoubleValue("fluency"));
                if (sentenceResult.containsKey("completeness"))
                    score.setCompleteness(sentenceResult.getDoubleValue("completeness"));

                // compute some telemetry
                if (sentenceResult.containsKey("wrong_words")
                        && sentenceResult.get("wrong_words") instanceof com.alibaba.fastjson.JSONArray) {
                    com.alibaba.fastjson.JSONArray wa = sentenceResult.getJSONArray("wrong_words");
                    score.setNumWrongWords(wa.size());
                }

                // set optional telemetry from request
                if (durationSeconds != null)
                    score.setDurationSeconds(durationSeconds);
                if (numSentences != null)
                    score.setNumSentences(numSentences);

                // set classification/linking fields
                if (scoreCategory != null)
                    score.setScoreCategory(scoreCategory);
                if (lessonId != null)
                    score.setLessonId(lessonId);
                if (testId != null)
                    score.setTestId(testId);
                if (lineId != null) {
                    try {
                        score.setLineId(Long.parseLong(lineId));
                    } catch (Exception ignore) {
                    }
                }
                if (vocabularyId != null) {
                    try {
                        score.setVocabularyId(Long.parseLong(vocabularyId));
                    } catch (Exception ignore) {
                    }
                }
                if (includeInDaily != null)
                    score.setIncludeInDaily(includeInDaily);
                if (sessionDate != null) {
                    try {
                        score.setSessionDate(java.time.LocalDateTime.parse(sessionDate));
                    } catch (Exception e) {
                        // If parsing fails, leave sessionDate as default createdAt
                    }
                }

                logger.info(score.toString());

                // set user if available
                if (principal != null && principal.id() != null) {
                    userRepository.findById(principal.id()).ifPresent(score::setUser);
                }

                IseScore saved = iseRepository.save(score);
                // also persist into new summary tables as appropriate
                try {
                    // persist daily entry when included in daily
                    // or when the attempt references a specific line or vocabulary id
                    // (so item-level attempts are tracked even if client did not set
                    // includeInDaily)
                    if (Boolean.TRUE.equals(saved.getIncludeInDaily()) || saved.getLineId() != null
                            || saved.getVocabularyId() != null) {
                        com.bucha.entity.IseDailyEntry d = new com.bucha.entity.IseDailyEntry();
                        d.setAttemptId(saved.getId());
                        d.setTotalScore(saved.getTotalScore());
                        d.setDurationSeconds(saved.getDurationSeconds());
                        d.setSessionDate(saved.getSessionDate());
                        d.setLessonId(saved.getLessonId());
                        // prefer saved values, fallback to request params
                        Long finalLineId = saved.getLineId();
                        if (finalLineId == null && lineId != null) {
                            try {
                                finalLineId = Long.parseLong(lineId);
                            } catch (Exception ignore) {
                            }
                        }
                        Long finalVocabId = saved.getVocabularyId();
                        if (finalVocabId == null && vocabularyId != null) {
                            try {
                                finalVocabId = Long.parseLong(vocabularyId);
                            } catch (Exception ignore) {
                            }
                        }
                        d.setLineId(finalLineId);
                        d.setVocabularyId(finalVocabId);
                        if (saved.getUser() != null)
                            d.setUser(saved.getUser());
                        iseDailyEntryRepository.save(d);
                    }

                    // persist lesson entry when lessonId present AND source indicates
                    // speaking-practice
                    logger.info("[IseService] lesson persist check: saved.lessonId={} source={}", saved.getLessonId(),
                            source);
                    if (saved.getLessonId() != null) {
                        if ("speaking-practice".equalsIgnoreCase(String.valueOf(source))) {
                            com.bucha.entity.IseLessonEntry le = new com.bucha.entity.IseLessonEntry();
                            le.setAttemptId(saved.getId());
                            le.setLessonId(saved.getLessonId());
                            le.setTotalScore(saved.getTotalScore());
                            le.setDurationSeconds(saved.getDurationSeconds());
                            le.setSessionDate(saved.getSessionDate());
                            if (saved.getUser() != null)
                                le.setUser(saved.getUser());
                            iseLessonEntryRepository.save(le);
                            logger.info("[IseService] persisted IseLessonEntry for attemptId={} lessonId={}",
                                    saved.getId(), saved.getLessonId());
                        } else {
                            logger.info(
                                    "[IseService] skipping IseLessonEntry persist because source!='speaking-practice' (source={})",
                                    source);
                        }
                    } else {
                        logger.info("[IseService] skipping IseLessonEntry persist because saved.lessonId is null");
                    }

                    // persist test entry when testId present
                    if (saved.getTestId() != null) {
                        com.bucha.entity.IseTestEntry te = new com.bucha.entity.IseTestEntry();
                        te.setAttemptId(saved.getId());
                        te.setTestId(saved.getTestId());
                        te.setTotalScore(saved.getTotalScore());
                        te.setDurationSeconds(saved.getDurationSeconds());
                        te.setSessionDate(saved.getSessionDate());
                        if (saved.getUser() != null)
                            te.setUser(saved.getUser());
                        iseTestEntryRepository.save(te);
                    }
                } catch (Throwable t) {
                    logger.warn("Failed to persist ISE summary entries: {}", t.getMessage());
                }
            } catch (Throwable t) {
                logger.warn("Failed to persist ISE score: {}", t.getMessage());
            }

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

    // Sửa lại phương thức extractWordScoresFromElement - HOÀN TOÀN MỚI
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

        // Bước 1: Tìm tất cả các syllable trong word
        NodeList sylls = wordElem.getElementsByTagName("syll");

        if (sylls == null || sylls.getLength() == 0) {
            // Không có syllable, thử lấy điểm trực tiếp từ word element
            out.put("overall", getAttrDouble(wordElem, "total_score", "overall_score", "score"));
            out.put("pronunciation", getAttrDouble(wordElem, "phone_score", "pronunciation_score"));
            out.put("tone", getAttrDouble(wordElem, "tone_score", "tone"));
            out.put("fluency", getAttrDouble(wordElem, "fluency_score"));
            out.put("completeness", getAttrDouble(wordElem, "integrity_score", "completeness", "accuracy_score"));

            // Nếu vẫn = 0, thử tính từ phone
            if (out.getDoubleValue("overall") == 0.0d) {
                return extractWordScoresFromPhones(wordElem);
            }
            return out;
        }

        // Bước 2: Tính điểm từ syllable (chính xác nhất)
        double totalSyllScore = 0.0d;
        double totalPhoneScore = 0.0d;
        double totalToneScore = 0.0d;
        int syllCount = 0;
        int phoneCount = 0;
        int toneCount = 0;
        int goodSyllCount = 0;
        int totalSyllsSeen = 0;

        com.alibaba.fastjson.JSONArray phonemeArr = new com.alibaba.fastjson.JSONArray();
        Set<String> seenPhonemes = new HashSet<>();
        double totalDuration = 0.0d;

        for (int si = 0; si < sylls.getLength(); si++) {
            Element syll = (Element) sylls.item(si);
            totalSyllsSeen++;

            // Kiểm tra syllable có bị lỗi không
            String syllDp = safeAttr(syll, "dp_message", "dpmsg", "dp-message");
            int syllDpInt = 0;
            try {
                syllDpInt = Integer.parseInt(syllDp == null || syllDp.isEmpty() ? "0" : syllDp);
            } catch (Exception ignored) {
            }

            if (syllDpInt == 0) {
                goodSyllCount++;
            }

            // Lấy điểm tổng của syllable
            double syllScore = getAttrDouble(syll, "total_score", "score", "overall_score");
            if (syllScore > 0.0d) {
                totalSyllScore += syllScore;
                syllCount++;
            }

            // Lấy tất cả phone trong syllable
            NodeList phones = syll.getElementsByTagName("phone");
            for (int pi = 0; phones != null && pi < phones.getLength(); pi++) {
                Element ph = (Element) phones.item(pi);

                String pContent = safeAttr(ph, "content", "p", "phoneme", "phone");
                if ((pContent == null || pContent.isEmpty()) && ph.getTextContent() != null)
                    pContent = ph.getTextContent().trim();
                if (pContent == null)
                    pContent = "";

                // Bỏ qua silence
                if ("sil".equalsIgnoreCase(pContent) || "silv".equalsIgnoreCase(pContent)) {
                    continue;
                }

                // Tránh duplicate
                double start = getAttrDouble(ph, "beg_pos", "begin", "start", "start_pos");
                String uniqueKey = pContent + "_" + start;
                if (seenPhonemes.contains(uniqueKey)) {
                    continue;
                }
                seenPhonemes.add(uniqueKey);

                // Tạo phoneme object
                JSONObject p = new JSONObject();
                p.put("phoneme", pContent);
                String display = pContent == null ? "" : pContent.replaceAll("^_+", "").replaceAll("(.)\\1{1,}", "$1");
                p.put("phoneme_display", display);

                String monoTone = safeAttr(ph, "mono_tone", "mono_tone_msg", "mono-tone");
                p.put("mono_tone", monoTone == null ? "" : monoTone);

                // Lấy phone score
                double phScore = getAttrDouble(ph, "phone_score", "phoneme_score", "pronunciation",
                        "pronunciation_score", "score");
                if (phScore == 0.0d) {
                    phScore = computePhoneScoreForPhone(ph, 0.0d);
                }
                p.put("score", phScore);

                String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
                String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
                p.put("perr_msg", perr == null ? "" : perr);
                p.put("dp_message", dpmsg == null ? "" : dpmsg);

                double end = getAttrDouble(ph, "end_pos", "end", "time_len");
                p.put("start", start);
                p.put("end", end);

                if (end > start) {
                    totalDuration += (end - start);
                }

                // Lấy tone score
                double phoneToneScore = getAttrDouble(ph, "tone_score", "tone", "mono_tone_score");
                if (phoneToneScore == 0.0d) {
                    phoneToneScore = computeToneScoreForPhone(ph, wordElem, monoTone);
                }
                p.put("tone_score", phoneToneScore);

                String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
                String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
                p.put("perr_level_msg", perrLevel == null ? "" : perrLevel);
                p.put("is_yun", isYun == null ? "" : isYun);

                phonemeArr.add(p);

                // Chỉ tính điểm cho phone không lỗi
                int dp = 0;
                try {
                    dp = Integer.parseInt(dpmsg == null || dpmsg.isEmpty() ? "0" : dpmsg);
                } catch (Exception ignored) {
                }

                if (dp == 0) {
                    if (phScore > 0.0d) {
                        totalPhoneScore += phScore;
                        phoneCount++;
                    }
                    if (phoneToneScore > 0.0d) {
                        totalToneScore += phoneToneScore;
                        toneCount++;
                    }
                }
            }
        }

        out.put("phonemes", phonemeArr);
        out.put("duration", totalDuration);

        // Bước 3: Tính điểm tổng
        double overall = 0.0d;
        double pronunciation = 0.0d;
        double tone = 0.0d;

        // Ưu tiên: syllable score > phone score average
        if (syllCount > 0) {
            overall = totalSyllScore / syllCount;
            pronunciation = overall; // Syllable score thường là tổng hợp pronunciation
        } else if (phoneCount > 0) {
            pronunciation = totalPhoneScore / phoneCount;
            overall = pronunciation;
        }

        // Tone score
        if (toneCount > 0) {
            tone = totalToneScore / toneCount;
        }

        // Completeness dựa trên số syllable đúng
        double completeness = 0.0d;
        if (totalSyllsSeen > 0) {
            completeness = ((double) goodSyllCount / (double) totalSyllsSeen) * 100.0;
        }

        // Fluency dựa trên số phone đúng trong số phone đã thấy
        double fluency = 0.0d;
        if (phonemeArr.size() > 0) {
            int goodPhones = 0;
            for (int i = 0; i < phonemeArr.size(); i++) {
                JSONObject p = phonemeArr.getJSONObject(i);
                String dp = p.getString("dp_message");
                int dpi = 0;
                try {
                    dpi = Integer.parseInt(dp == null || dp.isEmpty() ? "0" : dp);
                } catch (Exception ignored) {
                }
                if (dpi == 0) {
                    goodPhones++;
                }
            }
            fluency = ((double) goodPhones / (double) phonemeArr.size()) * 100.0;
        }

        out.put("overall", Math.min(100.0, Math.max(0.0, overall)));
        out.put("pronunciation", Math.min(100.0, Math.max(0.0, pronunciation)));
        out.put("tone", Math.min(100.0, Math.max(0.0, tone)));
        out.put("completeness", Math.min(100.0, Math.max(0.0, completeness)));
        out.put("fluency", Math.min(100.0, Math.max(0.0, fluency)));

        return out;
    }

    // Helper method: Tính điểm từ phone khi không có syllable
    private JSONObject extractWordScoresFromPhones(Element wordElem) {
        JSONObject out = new JSONObject();
        out.put("overall", 0);
        out.put("pronunciation", 0);
        out.put("tone", 0);
        out.put("duration", 0);
        out.put("completeness", 0);
        out.put("fluency", 0);

        NodeList phones = wordElem.getElementsByTagName("phone");
        if (phones == null || phones.getLength() == 0) {
            return out;
        }

        double accPhoneScore = 0.0d;
        double accToneScore = 0.0d;
        int countPhone = 0;
        int countTone = 0;
        int totalPhones = 0;
        int goodPhones = 0;
        double totalDur = 0.0d;

        com.alibaba.fastjson.JSONArray phonemeArr = new com.alibaba.fastjson.JSONArray();
        Set<String> seenPhonemes = new HashSet<>();

        for (int i = 0; i < phones.getLength(); i++) {
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
                phScore = computePhoneScoreForPhone(ph, 0.0d);
            p.put("score", phScore);

            String perr = safeAttr(ph, "perr_msg", "perr", "perrmsg");
            String dpmsg = safeAttr(ph, "dp_message", "dpmsg", "dp-message");
            p.put("perr_msg", perr == null ? "" : perr);
            p.put("dp_message", dpmsg == null ? "" : dpmsg);

            double end = getAttrDouble(ph, "end_pos", "end", "time_len");
            p.put("start", start);
            p.put("end", end);

            if (end > start) {
                totalDur += (end - start);
            }

            double phoneToneScore = getAttrDouble(ph, "tone_score", "tone", "mono_tone_score");
            if (phoneToneScore == 0.0d)
                phoneToneScore = computeToneScoreForPhone(ph, wordElem, monoTone);
            p.put("tone_score", phoneToneScore);

            String perrLevel = safeAttr(ph, "perr_level_msg", "perr_level", "perr_level_msg");
            String isYun = safeAttr(ph, "is_yun", "isyun", "is_yun");
            p.put("perr_level_msg", perrLevel == null ? "" : perrLevel);
            p.put("is_yun", isYun == null ? "" : isYun);

            phonemeArr.add(p);
            totalPhones++;

            int dp = 0;
            try {
                dp = Integer.parseInt(dpmsg == null || dpmsg.isEmpty() ? "0" : dpmsg);
            } catch (Exception ignored) {
            }

            if (dp == 0) {
                goodPhones++;
                if (phScore > 0.0d) {
                    accPhoneScore += phScore;
                    countPhone++;
                }
                if (phoneToneScore > 0.0d) {
                    accToneScore += phoneToneScore;
                    countTone++;
                }
            }
        }

        out.put("phonemes", phonemeArr);
        out.put("duration", totalDur);

        double overall = 0.0d;
        double pron = 0.0d;
        double tone = 0.0d;

        if (countPhone > 0) {
            pron = accPhoneScore / countPhone;
            overall = pron;
        }

        if (countTone > 0) {
            tone = accToneScore / countTone;
        }

        double completeness = totalPhones > 0 ? ((double) goodPhones / totalPhones * 100.0) : 0.0d;
        double fluency = totalPhones > 0 ? ((double) goodPhones / totalPhones * 100.0) : 0.0d;

        out.put("overall", Math.min(100.0, Math.max(0.0, overall)));
        out.put("pronunciation", Math.min(100.0, Math.max(0.0, pron)));
        out.put("tone", Math.min(100.0, Math.max(0.0, tone)));
        out.put("completeness", Math.min(100.0, Math.max(0.0, completeness)));
        out.put("fluency", Math.min(100.0, Math.max(0.0, fluency)));

        return out;
    }

    // GIỮ NGUYÊN phương thức extractWordScores cho sentence-level
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

        JSONObject out = new JSONObject();

        // ƯU TIÊN lấy điểm từ read_sentence element
        if (readSentence != null) {
            out.put("overall", getAttrDouble(readSentence, "total_score", "overall_score", "score"));
            out.put("pronunciation",
                    getAttrDouble(readSentence, "phone_score", "pronunciation_score", "pronunciation"));
            out.put("tone", getAttrDouble(readSentence, "tone_score", "tone"));
            out.put("duration", getAttrDouble(readSentence, "time_len", "duration"));
            out.put("completeness", getAttrDouble(readSentence, "integrity_score", "completeness", "accuracy_score"));
            out.put("fluency", getAttrDouble(readSentence, "fluency_score"));
        } else {
            out.put("overall", 0);
            out.put("pronunciation", 0);
            out.put("tone", 0);
            out.put("duration", 0);
            out.put("completeness", 0);
            out.put("fluency", 0);
        }

        // Chỉ tính từ phoneme nếu các điểm chính = 0
        double overall = out.getDoubleValue("overall");
        double pron = out.getDoubleValue("pronunciation");
        double tone = out.getDoubleValue("tone");
        double fluency = out.getDoubleValue("fluency");

        // Nếu đã có đủ điểm từ read_sentence, return luôn
        if (overall > 0.0d && pron > 0.0d) {
            com.alibaba.fastjson.JSONArray emptyArr = new com.alibaba.fastjson.JSONArray();
            out.put("phonemes", emptyArr);
            return out;
        }

        // Nếu chưa có điểm, tính từ phoneme
        Element wordElem = null;
        NodeList wn = doc.getElementsByTagName("word");
        if (wn != null && wn.getLength() > 0)
            wordElem = (Element) wn.item(0);

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

        // Chỉ override điểm nếu điểm gốc = 0
        if ((overall == 0.0d || pron == 0.0d) && countPhoneScore > 0) {
            double avgPhone = accPhoneScore / countPhoneScore;
            if (overall == 0.0d)
                overall = Math.min(100.0, Math.max(0.0, avgPhone));
            if (pron == 0.0d)
                pron = overall;
        } else if ((overall == 0.0d || pron == 0.0d) && fallbackPhoneScore > 0.0d) {
            if (overall == 0.0d)
                overall = Math.min(100.0, fallbackPhoneScore);
            if (pron == 0.0d)
                pron = overall;
        }

        if (tone == 0.0d && countToneScore > 0) {
            tone = Math.min(100.0, accToneScore / countToneScore);
        }

        if (fluency == 0.0d && totalPhonesSeen > 0) {
            fluency = ((double) goodPhonesCount / (double) totalPhonesSeen) * 100.0;
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
}
