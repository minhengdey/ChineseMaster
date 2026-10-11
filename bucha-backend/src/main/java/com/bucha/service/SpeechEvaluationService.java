package com.bucha.service;

import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.bucha.security.JwtUserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Runs iFlytek ISE scoring via {@link IseService#score} in-process so the authenticated
 * {@link JwtUserPrincipal} is always passed through — scores persist to {@code ise_score},
 * {@code ise_test_entry}, etc. with {@code user_id}.
 *
 * <p>Previously this called {@code POST /api/ise/score} over HTTP without cookies, so
 * {@code principal} was always null and nothing was linked to the user.</p>
 *
 * <p>The result is forwarded to Doubao AI by the caller (HSKKService / PronunciationService).</p>
 */
@Service
public class SpeechEvaluationService {

    private static final Logger       logger = LoggerFactory.getLogger(SpeechEvaluationService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final IseService iseService;

    public SpeechEvaluationService(IseService iseService) {
        this.iseService = iseService;
    }

    /**
     * Score pronunciation and parse the ISE JSON response.
     *
     * @param referenceText Chinese sentence to evaluate against
     * @param audioFile     user recording (webm / wav / mp3)
     * @param principal     current user (required for DB linkage)
     * @param optionalForm  optional params (lessonId, lineId, testId, scoreCategory, …) for persistence
     */
    public SpeechEvaluationResult evaluate(String referenceText, MultipartFile audioFile,
                                           JwtUserPrincipal principal,
                                           Map<String, String> optionalForm) {
        validateInputs(referenceText, audioFile);
        try {
            IseParams p = IseParams.from(optionalForm);
            ResponseEntity<?> resp = iseService.score(
                    principal,
                    referenceText,
                    audioFile,
                    p.reqSub,
                    p.reqEnt,
                    p.scoreCategory,
                    p.lessonId,
                    p.testId,
                    p.questionId,
                    p.includeInDaily,
                    p.sessionDate,
                    p.durationSeconds,
                    p.numSentences,
                    p.lineId,
                    p.vocabularyId,
                    p.source,
                    p.initialScore,
                    p.finalScore,
                    p.toneScore);

            if (resp.getStatusCode().value() == 422) {
                throw new IllegalStateException("Ghi âm chưa đạt chất lượng. Vui lòng nói to và rõ hơn.");
            }
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new IllegalStateException("Lỗi dịch vụ đánh giá phát âm (HTTP "
                        + resp.getStatusCode().value() + "): " + summarizeErrorBody(resp.getBody()));
            }

            String json = bodyToJsonString(resp.getBody());
            logger.info("[SpeechEvaluationService] ISE response (first 400): {}",
                    json.length() > 400 ? json.substring(0, 400) : json);

            JsonNode root = MAPPER.readTree(json);
            if (root.has("require_retry") && root.path("require_retry").asBoolean(false)) {
                throw new IllegalStateException(
                        root.path("message").asText("Ghi âm chưa đạt chất lượng. Vui lòng thử lại."));
            }
            if (root.has("error") && !root.has("sentence") && !root.has("words")) {
                throw new IllegalStateException(root.path("message").asText(root.path("error").asText("Lỗi chấm điểm.")));
            }

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

    private static String bodyToJsonString(Object body) throws Exception {
        if (body instanceof String s) {
            return s;
        }
        return MAPPER.writeValueAsString(body);
    }

    private static String summarizeErrorBody(Object body) {
        if (body == null) {
            return "";
        }
        if (body instanceof Map<?, ?> m) {
            Object err = m.get("error");
            Object hint = m.get("hint");
            StringBuilder sb = new StringBuilder();
            if (err != null) {
                sb.append(err);
            }
            if (hint != null) {
                if (sb.length() > 0) {
                    sb.append(" — ");
                }
                sb.append(hint);
            }
            return sb.toString();
        }
        return String.valueOf(body);
    }

    /**
     * Mirrors the multipart fields previously sent to {@code /api/ise/score}, merged with the same
     * defaults as the old RestTemplate client ({@code scoreCategory=hskk}, {@code includeInDaily=false}).
     */
    private static final class IseParams {
        String  reqSub;
        String  reqEnt;
        String  scoreCategory       = "hskk";
        Long    lessonId;
        Long    testId;
        Long    questionId;
        Boolean includeInDaily      = null;
        String  sessionDate;
        Double  durationSeconds;
        Integer numSentences;
        String  lineId;
        String  vocabularyId;
        String  source;
        Double  initialScore;
        Double  finalScore;
        Double  toneScore;

        static IseParams from(Map<String, String> optionalForm) {
            IseParams p = new IseParams();
            if (optionalForm == null) {
                return p;
            }
            for (Map.Entry<String, String> e : optionalForm.entrySet()) {
                String v = e.getValue();
                if (v == null || v.isBlank()) {
                    continue;
                }
                switch (e.getKey()) {
                    case "sub" -> p.reqSub = v;
                    case "ent" -> p.reqEnt = v;
                    case "scoreCategory" -> p.scoreCategory = v;
                    case "lessonId" -> p.lessonId = parseLong(v);
                    case "testId" -> p.testId = parseLong(v);
                    case "questionId" -> p.questionId = parseLong(v);
                    case "includeInDaily" -> p.includeInDaily = Boolean.parseBoolean(v);
                    case "sessionDate" -> p.sessionDate = v;
                    case "durationSeconds" -> p.durationSeconds = parseDouble(v);
                    case "numSentences" -> p.numSentences = parseInt(v);
                    case "lineId" -> p.lineId = v;
                    case "vocabularyId" -> p.vocabularyId = v;
                    case "source" -> p.source = v;
                    case "initialScore" -> p.initialScore = parseDouble(v);
                    case "finalScore" -> p.finalScore = parseDouble(v);
                    case "toneScore" -> p.toneScore = parseDouble(v);
                    default -> { /* ignore unknown keys */ }
                }
            }
            return p;
        }

        static Long parseLong(String s) {
            try {
                return Long.parseLong(s.trim());
            } catch (Exception e) {
                return null;
            }
        }

        static Double parseDouble(String s) {
            try {
                return Double.parseDouble(s.trim());
            } catch (Exception e) {
                return null;
            }
        }

        static Integer parseInt(String s) {
            try {
                return Integer.parseInt(s.trim());
            } catch (Exception e) {
                return null;
            }
        }
    }

    private static SpeechEvaluationResult parseIseResponse(JsonNode root, String referenceText) {
        SpeechEvaluationResult result = new SpeechEvaluationResult();
        result.setSentence(referenceText);

        try {
            result.setRawIseData(MAPPER.treeToValue(root, Object.class));
        } catch (Exception ignored) {
        }

        JsonNode sentenceNode = root.path("sentence");

        double totalScore = extractDouble(sentenceNode, "total_score", "totalScore");
        if (totalScore == 0.0) {
            totalScore = extractDouble(root, "total_score", "totalScore");
        }
        result.setTotalScore(clamp(totalScore));
        result.setFluencyScore(clamp(extractDouble(sentenceNode, "fluency", "fluencyScore")));
        result.setCompletenessScore(clamp(extractDouble(sentenceNode, "completeness", "completenessScore")));
        result.setRejected(sentenceNode.path("is_rejected").asBoolean(false));

        JsonNode words = root.path("words");
        double phoneSum = 0, toneSum = 0;
        int phoneCount = 0, toneCount = 0;

        if (words.isArray()) {
            for (JsonNode word : words) {
                double phone = wordSubScore(word, "initial_score", "initialScore");
                if (phone > 0) {
                    phoneSum += phone;
                    phoneCount++;
                }

                double tone = wordSubScore(word, "tone_score", "toneScore");
                if (tone > 0) {
                    toneSum += tone;
                    toneCount++;
                }
            }
        }

        result.setPhoneScore(phoneCount > 0 ? clamp(phoneSum / phoneCount) : 0.0);
        result.setToneScore(toneCount > 0 ? clamp(toneSum / toneCount) : 0.0);

        logger.info("[SpeechEvaluationService] Parsed: {}", result);
        return result;
    }

    private static double extractDouble(JsonNode node, String key1, String key2) {
        if (node == null || node.isMissingNode()) {
            return 0.0;
        }
        JsonNode v = node.path(key1);
        if (!v.isMissingNode() && !v.isNull()) {
            return v.asDouble();
        }
        v = node.path(key2);
        if (!v.isMissingNode() && !v.isNull()) {
            return v.asDouble();
        }
        return 0.0;
    }

    private static double wordSubScore(JsonNode word, String snakeKey, String camelKey) {
        JsonNode details = word.path("details");
        if (!details.isMissingNode()) {
            double v = extractDouble(details, snakeKey, camelKey);
            if (v > 0) {
                return v;
            }
        }
        return extractDouble(word, snakeKey, camelKey);
    }

    private static double clamp(double v) {
        return Math.max(0.0, Math.min(100.0, v));
    }

    private static void validateInputs(String text, MultipartFile file) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Reference text must not be empty.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file must not be empty.");
        }
    }
}
