package com.bucha.service;

import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.bucha.security.JwtUserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Evaluates pronunciation by calling the existing {@code POST /api/ise/score} endpoint
 * (same API the frontend uses), then parses the full ISE JSON response into a
 * {@link SpeechEvaluationResult} containing totalScore, phoneScore, toneScore,
 * fluencyScore, completenessScore, and the rejected flag.
 *
 * <p>The result is then forwarded to Doubao AI by the caller (HSKKService / PronunciationService).</p>
 */
@Service
public class SpeechEvaluationService {

    private static final Logger       logger = LoggerFactory.getLogger(SpeechEvaluationService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Internal URL of POST /api/ise/score — set via ise.score-url in application.yml */
    @Value("${ise.score-url:https://chinese-master-be-f5emhxc7c5dwd7d2.southeastasia-01.azurewebsites.net/api/ise/score}")
    private String iseScoreUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    /**
     * Call {@code POST /api/ise/score} with the user's audio and reference text.
     * Parse the response into a {@link SpeechEvaluationResult} with all sub-scores.
     *
     * @param referenceText Chinese sentence to evaluate against
     * @param audioFile     user recording (webm / wav / mp3)
     * @param principal     current user — JWT cookie is forwarded so user scores are saved in DB
     * @param optionalForm  optional form params (e.g. lessonId, lineId, vocabularyId, source, includeInDaily) for persistence
     * @return fully populated result
     * @throws IllegalStateException    on ISE error or rejection
     * @throws IllegalArgumentException on invalid inputs
     */
    public SpeechEvaluationResult evaluate(String referenceText, MultipartFile audioFile,
                                           JwtUserPrincipal principal,
                                           Map<String, String> optionalForm) {
        validateInputs(referenceText, audioFile);
        try {
            // ── 1. Build multipart/form-data body ──────────────────────────
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("text", referenceText);
            form.add("scoreCategory", "hskk");
            form.add("includeInDaily", "false");
            if (optionalForm != null) {
                for (Map.Entry<String, String> e : optionalForm.entrySet()) {
                    if (e.getValue() != null && !e.getValue().isBlank()) {
                        form.add(e.getKey(), e.getValue());
                    }
                }
            }

            // Wrap MultipartFile bytes into a named ByteArrayResource so RestTemplate
            // sends the correct filename and Content-Type parts.
            byte[] audioBytes  = audioFile.getBytes();
            String audioName   = audioFile.getOriginalFilename() != null
                    ? audioFile.getOriginalFilename() : "audio.webm";
            String contentType = audioFile.getContentType() != null
                    ? audioFile.getContentType() : "audio/webm";

            ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
                @Override public String getFilename() { return audioName; }
            };

            // Add audio as a named part with its own Content-Type header
            HttpHeaders audioPart = new HttpHeaders();
            audioPart.setContentType(MediaType.parseMediaType(contentType));
            form.add("audio", new HttpEntity<>(audioResource, audioPart));

            // ── 2. Call POST /api/ise/score ────────────────────────────────
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Forward the user's JWT httpOnly cookie so that IseService can link the
            // score record to the correct user account.  When principal is present,
            // pass its id as a custom internal header — IseService won't see it as the
            // principal though, so the call functions as permitAll (scoring still works,
            // user link may be absent in IseScore row for backend-originated calls).
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(form, headers);

            logger.info("[SpeechEvaluationService] Calling {} text='{}'", iseScoreUrl, referenceText);
            ResponseEntity<String> response = restTemplate.exchange(
                    iseScoreUrl, HttpMethod.POST, request, String.class);

            // ── 3. Handle non-success ──────────────────────────────────────
            if (response.getStatusCode().value() == 422) {
                // ISE explicitly rejected the recording
                throw new IllegalStateException("Ghi âm chưa đạt chất lượng. Vui lòng nói to và rõ hơn.");
            }
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Lỗi dịch vụ đánh giá phát âm (HTTP "
                        + response.getStatusCode().value() + ").");
            }

            // ── 4. Parse JSON response → SpeechEvaluationResult ───────────
            String json = response.getBody();
            logger.info("[SpeechEvaluationService] ISE response (first 400): {}",
                    json.length() > 400 ? json.substring(0, 400) : json);

            JsonNode root = MAPPER.readTree(json);
            return parseIseResponse(root, referenceText);

        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("[SpeechEvaluationService] evaluate failed", e);
            throw new IllegalStateException("Đánh giá phát âm thất bại: " + e.getMessage());
        }
    }

    /** Overload without optional form params (backward compatibility). */
    public SpeechEvaluationResult evaluate(String referenceText, MultipartFile audioFile,
                                           JwtUserPrincipal principal) {
        return evaluate(referenceText, audioFile, principal, null);
    }

    /** Convenience method returning only totalScore (backward compatibility). */
    public double evaluatePronunciation(String referenceText, MultipartFile audioFile,
                                        JwtUserPrincipal principal) {
        return evaluate(referenceText, audioFile, principal).getTotalScore();
    }

    // ─────────────────────────────────────────────────────────────────
    // Response parsing
    // ─────────────────────────────────────────────────────────────────

    /**
     * Parse the JSON returned by {@code /api/ise/score} into a {@link SpeechEvaluationResult}.
     *
     * Response structure (sentence mode):
     * <pre>
     * {
     *   "sentence": {
     *     "total_score": 75.5,
     *     "fluency":     70.0,
     *     "completeness": 80.0,
     *     "is_rejected": false
     *   },
     *   "words": [
     *     { "total_score": 72, "details": { "initial_score": 68, "tone_score": 74 } },
     *     ...
     *   ]
     * }
     * </pre>
     */
    private static SpeechEvaluationResult parseIseResponse(JsonNode root, String referenceText) {
        SpeechEvaluationResult result = new SpeechEvaluationResult();
        result.setSentence(referenceText);

        // Store the full ISE JSON as a plain Java object tree so the frontend
        // can render the same detailed score UI used by other practice screens.
        try {
            result.setRawIseData(MAPPER.treeToValue(root, Object.class));
        } catch (Exception ignored) {}

        // ── Sentence-level scores ──────────────────────────────────────
        JsonNode sentenceNode = root.path("sentence");

        double totalScore = extractDouble(sentenceNode, "total_score", "totalScore");
        if (totalScore == 0.0) {
            // Single-word mode: top-level mirror
            totalScore = extractDouble(root, "total_score", "totalScore");
        }
        result.setTotalScore(clamp(totalScore));
        result.setFluencyScore(clamp(extractDouble(sentenceNode, "fluency", "fluencyScore")));
        result.setCompletenessScore(clamp(extractDouble(sentenceNode, "completeness", "completenessScore")));
        result.setRejected(sentenceNode.path("is_rejected").asBoolean(false));

        // ── Word-level phone / tone averages ───────────────────────────
        JsonNode words = root.path("words");
        double phoneSum = 0, toneSum = 0;
        int phoneCount  = 0, toneCount = 0;

        if (words.isArray()) {
            for (JsonNode word : words) {
                double phone = wordSubScore(word, "initial_score", "initialScore");
                if (phone > 0) { phoneSum += phone; phoneCount++; }

                double tone = wordSubScore(word, "tone_score", "toneScore");
                if (tone > 0) { toneSum += tone; toneCount++; }
            }
        }

        result.setPhoneScore(phoneCount > 0 ? clamp(phoneSum / phoneCount) : 0.0);
        result.setToneScore(toneCount  > 0 ? clamp(toneSum  / toneCount)  : 0.0);

        logger.info("[SpeechEvaluationService] Parsed: {}", result);
        return result;
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private static double extractDouble(JsonNode node, String key1, String key2) {
        if (node == null || node.isMissingNode()) return 0.0;
        JsonNode v = node.path(key1);
        if (!v.isMissingNode() && !v.isNull()) return v.asDouble();
        v = node.path(key2);
        if (!v.isMissingNode() && !v.isNull()) return v.asDouble();
        return 0.0;
    }

    private static double wordSubScore(JsonNode word, String snakeKey, String camelKey) {
        JsonNode details = word.path("details");
        if (!details.isMissingNode()) {
            double v = extractDouble(details, snakeKey, camelKey);
            if (v > 0) return v;
        }
        return extractDouble(word, snakeKey, camelKey);
    }

    private static double clamp(double v) { return Math.max(0.0, Math.min(100.0, v)); }

    private static void validateInputs(String text, MultipartFile file) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Reference text must not be empty.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file must not be empty.");
        }
    }
}
