package com.bucha.client;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.bucha.config.IflytekProperties;
import com.bucha.pronunciation.IseFileStreamer;
import com.bucha.pronunciation.IseGlobalMessageBuilder;
import com.bucha.pronunciation.IseGlobalUrlSigner;
import com.bucha.pronunciation.IseGlobalWebSocketClient;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
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
import java.util.Base64;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/**
 * Stateless client that submits a user audio file to iFlytek ISE WebSocket API
 * and returns a parsed {@link IflytekEvaluationResult}.
 *
 * <p>This class owns only network I/O and XML parsing.
 * No persistence, no HTTP layer concerns.</p>
 */
@Component
public class IflytekClient {

    private static final Logger logger = LoggerFactory.getLogger(IflytekClient.class);

    private static final String WS_HOST         = "ise-api-sg.xf-yun.com";
    private static final String WS_PATH         = "/v2/ise";
    private static final int    LATCH_TIMEOUT_S = 180;

    private final IflytekProperties props;

    public IflytekClient(IflytekProperties props) {
        this.props = props;
    }

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    /**
     * Evaluate the pronunciation of {@code audioFile} against {@code referenceText}.
     *
     * @param referenceText Chinese text that the user was supposed to read
     * @param audioFile     User recording (webm/wav/mp3 – converted internally)
     * @return parsed evaluation result
     * @throws IflytekApiException if the API returns an error or the recording is rejected
     */
    public IflytekEvaluationResult evaluate(String referenceText, MultipartFile audioFile) {
        validateInputs(referenceText, audioFile);

        Path uploadedTemp = null;
        File wavFile      = null;

        try {
            uploadedTemp = stageUploadedFile(audioFile);
            wavFile = ensureWavFile(uploadedTemp, audioFile.getOriginalFilename(), audioFile.getContentType());
            return runWebSocketEvaluation(referenceText, wavFile);
        } catch (IflytekApiException e) {
            throw e;
        } catch (UnsupportedAudioFileException e) {
            throw new IflytekApiException("Unsupported audio format. Please use WAV, MP3, or WebM.", e);
        } catch (Exception e) {
            logger.error("IflytekClient.evaluate failed", e);
            throw new IflytekApiException("Speech evaluation failed: " + e.getMessage(), e);
        } finally {
            silentDelete(uploadedTemp);
            if (wavFile != null) silentDelete(wavFile.toPath());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Core WebSocket evaluation
    // ─────────────────────────────────────────────────────────────────

    private IflytekEvaluationResult runWebSocketEvaluation(String referenceText, File wavFile) throws Exception {
        final String normalizedText = normalizeChineseText(referenceText);
        final String signedUrl = IseGlobalUrlSigner.generateSignedUrl(
                WS_HOST, props.getApiKey(), props.getApiSecret(), WS_PATH);

        // Build ISE first-frame JSON
        final JSONObject firstFrame = buildFirstFrame(normalizedText);

        final CountDownLatch               latch         = new CountDownLatch(1);
        final AtomicBoolean                cancelled     = new AtomicBoolean(false);
        final AtomicReference<String>      sidRef        = new AtomicReference<>();
        final AtomicReference<JSONObject>  resultJsonRef = new AtomicReference<>();
        final AtomicReference<String>      errorRef      = new AtomicReference<>();
        final AtomicReference<IseGlobalWebSocketClient> clientRef = new AtomicReference<>();

        IseGlobalWebSocketClient wsClient = new IseGlobalWebSocketClient(signedUrl, new WebSocketListener() {

            @Override
            public void onOpen(WebSocket ws, Response response) {
                logger.debug("[IflytekClient] WebSocket opened");
                try {
                    clientRef.get().sendJson(firstFrame);
                } catch (Exception e) {
                    logger.error("[IflytekClient] Failed to send first frame", e);
                    cancelled.set(true);
                    latch.countDown();
                    return;
                }
                // Stream audio in a dedicated thread
                new Thread(() -> {
                    try {
                        Consumer<String> sender = json -> {
                            if (!cancelled.get()) clientRef.get().sendJson(JSONObject.parseObject(json));
                        };
                        IseFileStreamer.streamFile(wavFile, sender, props.getAppId(), normalizedText, cancelled);
                    } catch (Exception e) {
                        logger.error("[IflytekClient] Streaming failed", e);
                        cancelled.set(true);
                        latch.countDown();
                    }
                }, "iflytek-stream").start();
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                try {
                    JSONObject resp = JSONObject.parseObject(text);
                    int code = resp.getIntValue("code");
                    if (code != 0) {
                        logger.warn("[IflytekClient] ISE error code={} sid={}", code, resp.getString("sid"));
                        errorRef.set("ISE returned error code " + code + ": " + resp.getString("message"));
                        cancelled.set(true);
                        latch.countDown();
                        return;
                    }
                    String sid = resp.getString("sid");
                    if (sid != null) sidRef.compareAndSet(null, sid);

                    JSONObject data = resp.getJSONObject("data");
                    if (data == null) return;

                    if (data.getIntValue("status") == 2) {
                        String b64 = data.getString("data");
                        if (b64 != null && !b64.isEmpty()) {
                            resultJsonRef.set(resp); // store full response for parsing
                            // decode the Base64 XML and store result
                            byte[] decoded = Base64.getDecoder().decode(b64);
                            String xml = new String(decoded, StandardCharsets.UTF_8);
                            JSONObject parsed = parseXmlToJson(xml);
                            if (parsed != null) resultJsonRef.set(parsed);
                        }
                        latch.countDown();
                    }
                } catch (Exception e) {
                    logger.error("[IflytekClient] Error in onMessage", e);
                    cancelled.set(true);
                    latch.countDown();
                }
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                logger.error("[IflytekClient] WebSocket failure: {}", t.getMessage());
                errorRef.set("WebSocket error: " + t.getMessage());
                cancelled.set(true);
                latch.countDown();
            }
        });

        clientRef.set(wsClient);
        wsClient.connect();

        boolean timedOut = !latch.await(LATCH_TIMEOUT_S, TimeUnit.SECONDS);
        wsClient.close();

        if (timedOut) {
            throw new IflytekApiException("Speech evaluation timed out after " + LATCH_TIMEOUT_S + "s.");
        }
        if (errorRef.get() != null) {
            throw new IflytekApiException(errorRef.get());
        }

        JSONObject parsed = resultJsonRef.get();
        if (parsed == null) {
            throw new IflytekApiException("No result received from iFlytek ISE.");
        }

        return toEvaluationResult(parsed, sidRef.get());
    }

    // ─────────────────────────────────────────────────────────────────
    // First-frame builder
    // ─────────────────────────────────────────────────────────────────

    private JSONObject buildFirstFrame(String text) {
        JSONObject frame = IseGlobalMessageBuilder.buildFirstFrame(
                props.getAppId(),
                props.getSub(),
                props.getEnt(),
                props.getCategory(),
                text,
                "utf-8");
        // Inject extra ISE params (phoneme output, core type)
        try {
            JSONObject parameter = frame.containsKey("parameter")
                    ? frame.getJSONObject("parameter")
                    : new JSONObject();
            JSONObject st = parameter.containsKey("st") ? parameter.getJSONObject("st") : new JSONObject();
            st.put("core", "read_sentence");
            st.put("phoneme_output", "1");
            st.put("ref_text", text);
            parameter.put("st", st);
            frame.put("parameter", parameter);
        } catch (Exception ignored) {}
        return frame;
    }

    // ─────────────────────────────────────────────────────────────────
    // XML → JSONObject parsing
    // ─────────────────────────────────────────────────────────────────

    private JSONObject parseXmlToJson(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xml)));

            Element root = locateSentenceElement(doc);
            if (root == null) return null;

            JSONObject out = new JSONObject();
            out.put("total_score",      parseDouble(root.getAttribute("total_score")));
            out.put("fluency_score",    parseDouble(root.getAttribute("fluency_score")));
            out.put("integrity_score",  parseDouble(root.getAttribute("integrity_score")));
            boolean rejected = "true".equalsIgnoreCase(root.getAttribute("is_rejected"))
                    || "1".equals(root.getAttribute("is_rejected"));
            out.put("is_rejected", rejected);
            out.put("except_info", root.getAttribute("except_info"));

            // Word-level scores
            JSONArray words = new JSONArray();
            NodeList wordNodes = root.getElementsByTagName("word");
            for (int i = 0; i < wordNodes.getLength(); i++) {
                Element w = (Element) wordNodes.item(i);
                JSONObject wj = new JSONObject();
                wj.put("content",     w.getAttribute("content"));
                wj.put("total_score", parseDouble(w.getAttribute("total_score")));
                wj.put("fluency",     parseDouble(w.getAttribute("fluency_score")));
                words.add(wj);
            }
            out.put("words", words);
            return out;
        } catch (Exception e) {
            logger.warn("[IflytekClient] XML parse failed: {}", e.getMessage());
            return null;
        }
    }

    private static Element locateSentenceElement(Document doc) {
        for (String tag : new String[]{"read_sentence", "read_word"}) {
            NodeList nl = doc.getElementsByTagName(tag);
            for (int i = nl.getLength() - 1; i >= 0; i--) {
                Element e = (Element) nl.item(i);
                if (!e.getAttribute("total_score").isEmpty()) return e;
            }
            if (nl.getLength() > 0) return (Element) nl.item(0);
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────
    // Convert parsed JSON → IflytekEvaluationResult
    // ─────────────────────────────────────────────────────────────────

    private static IflytekEvaluationResult toEvaluationResult(JSONObject json, String sid) {
        double total        = clamp(json.getDoubleValue("total_score"));
        double fluency      = json.containsKey("fluency_score")   ? clamp(json.getDoubleValue("fluency_score"))   : -1.0;
        double completeness = json.containsKey("integrity_score") ? clamp(json.getDoubleValue("integrity_score")) : -1.0;
        boolean rejected    = json.getBooleanValue("is_rejected");

        if (rejected) {
            logger.warn("[IflytekClient] Recording rejected by ISE (except_info={})", json.getString("except_info"));
            throw new IflytekApiException(
                    "Recording quality too low. Please speak more clearly and try again.");
        }

        return IflytekEvaluationResult.builder()
                .totalScore(total)
                .fluencyScore(fluency)
                .completenessScore(completeness)
                .rejected(false)
                .sessionId(sid)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────
    // Audio helpers
    // ─────────────────────────────────────────────────────────────────

    private static Path stageUploadedFile(MultipartFile file) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        Path tmp = Files.createTempFile("pronunciation-upload-", "." + ext);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
        }
        return tmp;
    }

    /**
     * Converts any supported audio format to 16kHz 16-bit mono PCM WAV, which ISE requires.
     */
    private static File ensureWavFile(Path source, String originalName, String contentType)
            throws Exception {
        File sourceFile = source.toFile();
        Path wavTemp = Files.createTempFile("pronunciation-wav-", ".wav");
        File wavFile = wavTemp.toFile();
        try {
            AudioInputStream rawAis = AudioSystem.getAudioInputStream(sourceFile);
            AudioFormat targetFmt = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED, 16000f, 16, 1, 2, 16000f, false);
            AudioInputStream convertedAis;
            try {
                convertedAis = AudioSystem.getAudioInputStream(targetFmt, rawAis);
            } catch (IllegalArgumentException ex) {
                // If direct conversion is not supported, try two-step conversion
                AudioFormat intermediate = new AudioFormat(
                        AudioFormat.Encoding.PCM_SIGNED, rawAis.getFormat().getSampleRate(),
                        16, rawAis.getFormat().getChannels(),
                        rawAis.getFormat().getChannels() * 2, rawAis.getFormat().getSampleRate(), false);
                AudioInputStream step1 = AudioSystem.getAudioInputStream(intermediate, rawAis);
                convertedAis = AudioSystem.getAudioInputStream(targetFmt, step1);
            }
            AudioSystem.write(convertedAis, AudioFileFormat.Type.WAVE, wavFile);
            logger.debug("[IflytekClient] WAV written: {} bytes", wavFile.length());
            return wavFile;
        } catch (UnsupportedAudioFileException e) {
            silentDelete(wavTemp);
            throw e;
        } catch (Exception e) {
            silentDelete(wavTemp);
            throw new IOException("Audio conversion to WAV failed: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Validation helpers
    // ─────────────────────────────────────────────────────────────────

    private static void validateInputs(String text, MultipartFile file) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Reference text must not be empty.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file must not be empty.");
        }
        // Must contain at least one Unicode letter character (e.g. Chinese hanzi)
        if (!text.trim().matches(".*\\p{L}.*")) {
            throw new IllegalArgumentException("Reference text must contain at least one letter.");
        }
    }

    /** Strips punctuation and normalises whitespace for ISE. */
    private static String normalizeChineseText(String text) {
        return text.replaceAll("[，。！？、；：\"\"''（）【】《》]", " ").replaceAll("\\s+", " ").trim();
    }

    // ─────────────────────────────────────────────────────────────────
    // Misc helpers
    // ─────────────────────────────────────────────────────────────────

    private static double parseDouble(String s) {
        if (s == null || s.isEmpty()) return 0.0;
        try { return Double.parseDouble(s); } catch (NumberFormatException e) { return 0.0; }
    }

    private static double clamp(double v) { return Math.max(0.0, Math.min(100.0, v)); }

    private static String getExtension(String name) {
        if (name == null || !name.contains(".")) return "tmp";
        return name.substring(name.lastIndexOf('.') + 1);
    }

    private static void silentDelete(Path p) {
        try { if (p != null) Files.deleteIfExists(p); } catch (Exception ignored) {}
    }
}
