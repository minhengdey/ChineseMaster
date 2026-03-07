package com.bucha.client;

import com.bucha.config.DoubaoProperties;
import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.bucha.dto.pronunciation.StructuredFeedbackDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.regex.Pattern;

/**
 * Stateless HTTP client for the Doubao AI chat completions endpoint.
 *
 * <p>Uses the OpenAI-compatible {@code /v1/chat/completions} interface.
 * Sends structured ISE sub-scores so the model produces precise, actionable Vietnamese feedback.
 * Falls back to built-in text on any error so the scoring pipeline is never blocked.</p>
 */
@Component
public class DoubaoClient {

    private static final Logger       logger    = LoggerFactory.getLogger(DoubaoClient.class);
    private static final ObjectMapper MAPPER    = new ObjectMapper();
    private static final int          MAX_CHARS = 300;

    private final DoubaoProperties props;
    private final RestTemplate     restTemplate;

    public DoubaoClient(DoubaoProperties props) {
        this.props       = props;
        this.restTemplate = new RestTemplate();
    }

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    /**
     * Generate structured Vietnamese feedback (HSKK judge style) from a full {@link SpeechEvaluationResult}.
     * Uses prompt that asks for JSON: overall_feedback, pronunciation_issue, tone_issue, fluency_issue, improvement_tip.
     */
    public StructuredFeedbackDto generateStructuredFeedback(SpeechEvaluationResult eval) {
        if (!isConfigured()) {
            logger.debug("[DoubaoClient] API key not configured – using default feedback");
            return defaultStructuredFeedback(eval.getTotalScore(), eval.isRejected());
        }
        try {
            String prompt = buildStructuredPrompt(eval);
            String content = callApi(prompt);
            StructuredFeedbackDto parsed = parseStructuredFeedback(content);
            if (parsed != null) return parsed;
        } catch (DoubaoApiException e) {
            logger.warn("[DoubaoClient] API call failed ({}), falling back to default.", e.getMessage());
        }
        return defaultStructuredFeedback(eval.getTotalScore(), eval.isRejected());
    }

    /**
     * Generate plain feedback string (returns overall_feedback from structured response).
     */
    public String generateFeedback(SpeechEvaluationResult eval) {
        StructuredFeedbackDto dto = generateStructuredFeedback(eval);
        return dto.getOverallFeedback() != null ? truncate(dto.getOverallFeedback()) : defaultFeedback(eval.getTotalScore(), eval.isRejected());
    }

    /**
     * Convenience overload for callers that only have a score + text (no sub-scores).
     */
    public String generateFeedback(double score, String text) {
        SpeechEvaluationResult simple = new SpeechEvaluationResult();
        simple.setTotalScore(score);
        simple.setSentence(text);
        simple.setRejected(false);
        return generateFeedback(simple);
    }

    // ─────────────────────────────────────────────────────────────────
    // Structured prompt (HSKK judge → JSON)
    // ─────────────────────────────────────────────────────────────────

    private static final Pattern JSON_BLOCK = Pattern.compile("(?s)```(?:json)?\\s*([^`]+)```");

    static String buildStructuredPrompt(SpeechEvaluationResult eval) {
        String sentence = eval.getSentence() != null ? eval.getSentence() : "";
        double total = eval.getTotalScore();
        double phone = eval.getPhoneScore();
        double tone = eval.getToneScore();
        double fluency = eval.getFluencyScore();
        String wordAnalysis = formatWordAnalysis(eval);

        StringBuilder sb = new StringBuilder();

        sb.append("Bạn là giám khảo HSKK Sơ cấp và giáo viên dạy phát âm tiếng Trung.\n\n");

        sb.append("Dựa trên dữ liệu phát âm sau:\n\n");

        sb.append("Sentence: ").append(sentence).append("\n\n");

        sb.append("Scores:\n");
        sb.append("- Total: ").append(String.format("%.2f", total)).append("\n");
        sb.append("- Pronunciation: ").append(String.format("%.2f", phone)).append("\n");
        sb.append("- Tone: ").append(String.format("%.2f", tone)).append("\n");
        sb.append("- Fluency: ").append(String.format("%.2f", fluency)).append("\n\n");

        sb.append("Word analysis:\n").append(wordAnalysis).append("\n\n");

        sb.append("Hãy phân tích lỗi phát âm và trả về JSON đúng format sau ");
        sb.append("(chỉ trả lời bằng JSON hợp lệ, không thêm markdown hoặc giải thích):\n\n");

        sb.append("{\n");
        sb.append("  \"overall_feedback\": \"nhận xét tổng thể <100 chữ>\",\n");
        sb.append("  \"pronunciation_issue\": \"mô tả lỗi thanh mẫu hoặc vận mẫu nếu có\",\n");
        sb.append("  \"tone_issue\": \"phân tích lỗi thanh điệu nếu có\",\n");
        sb.append("  \"fluency_issue\": \"lỗi độ trôi chảy nếu có\",\n");
        sb.append("  \"improvement_tip\": \"gợi ý luyện tập\",\n");
        sb.append("  \"detailed_errors\": [\n");
        sb.append("    {\n");
        sb.append("      \"character\": \"chữ Hán sai\",\n");
        sb.append("      \"pinyin_correct\": \"pinyin đúng\",\n");
        sb.append("      \"tone_correct\": \"thanh đúng\",\n");
        sb.append("      \"tone_spoken\": \"thanh người học nói\",\n");
        sb.append("      \"issue\": \"mô tả ngắn lỗi phát âm\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");

        sb.append("Yêu cầu phân tích:\n");

        sb.append("1. pronunciation_issue:\n");
        sb.append("- Chỉ ra lỗi phát âm liên quan đến thanh mẫu (initial) hoặc vận mẫu (final).\n");
        sb.append("- Ví dụ thanh mẫu: zh, ch, sh, r, z, c, s, j, q, x.\n");
        sb.append("- Ví dụ vận mẫu: a, e, i, u, ü, ang, eng, ong...\n");
        sb.append("- Nếu một thanh mẫu hoặc vận mẫu bị sai nhiều lần trong câu thì phải nói rõ lỗi đó lặp lại nhiều lần.\n");

        sb.append("2. tone_issue:\n");
        sb.append("- Chỉ ra lỗi thanh điệu cụ thể nếu có.\n");
        sb.append("- Nêu rõ thanh đúng là thanh 1,2,3,4.\n");
        sb.append("- So sánh với thanh người học nói.\n");

        sb.append("3. detailed_errors:\n");
        sb.append("- Liệt kê từng chữ Hán phát âm sai.\n");
        sb.append("- Phải ghi rõ pinyin chuẩn của chữ đó.\n");
        sb.append("- Chỉ ra thanh đúng và thanh người học nói.\n");
        sb.append("- Nếu không phát hiện lỗi thì trả về mảng rỗng [].\n");

        sb.append("4. fluency_issue:\n");
        sb.append("- Nhận xét về tốc độ nói, ngắt nghỉ hoặc độ trôi chảy.\n");

        sb.append("5. improvement_tip:\n");
        sb.append("- Gợi ý cách luyện tập để sửa lỗi phát âm.\n");

        sb.append("Tất cả nội dung phải viết bằng tiếng Việt.\n");
        sb.append("Chỉ trả về JSON hợp lệ.\n");
        return sb.toString();
    }

    /**
     * Build full per-word results as JSON for the Doubao prompt (content, total_score, details, etc.).
     */
    static String formatWordAnalysis(SpeechEvaluationResult eval) {
        Object raw = eval.getRawIseData();
        if (raw == null) return "(không có dữ liệu từng từ)";
        try {
            JsonNode root = MAPPER.valueToTree(raw);
            JsonNode words = root.path("words");
            if (!words.isArray() || words.size() == 0) return "(không có dữ liệu từng từ)";
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(words);
        } catch (Exception e) {
            return "(không parse được word analysis)";
        }
    }

    private static StructuredFeedbackDto parseStructuredFeedback(String content) {
        if (content == null || content.isBlank()) return null;
        String json = content.trim();
        // Strip ```json ... ``` if present
        var m = JSON_BLOCK.matcher(json);
        if (m.find()) json = m.group(1).trim();

        StructuredFeedbackDto dto = tryParseStructuredJson(json);
        if (dto != null) return dto;

        // Response may be truncated by max_tokens (e.g. cut mid-string). Try to close the JSON and parse again.
        String repaired = repairTruncatedJson(json);
        if (repaired != null) {
            dto = tryParseStructuredJson(repaired);
            if (dto != null) {
                logger.debug("[DoubaoClient] Parsed repaired (truncated) JSON successfully");
                return dto;
            }
        }

        logger.debug("[DoubaoClient] Failed to parse structured JSON, could not salvage");
        return null;
    }

    private static StructuredFeedbackDto tryParseStructuredJson(String json) {
        try {
            JsonNode root = MAPPER.readTree(json);
            StructuredFeedbackDto dto = new StructuredFeedbackDto();
            dto.setOverallFeedback(text(root, "overall_feedback"));
            dto.setPronunciationIssue(text(root, "pronunciation_issue"));
            dto.setToneIssue(text(root, "tone_issue"));
            dto.setFluencyIssue(text(root, "fluency_issue"));
            dto.setImprovementTip(text(root, "improvement_tip"));
            return dto;
        } catch (Exception e) {
            logger.debug("[DoubaoClient] Failed to parse structured JSON: {}", e.getMessage());
            return null;
        }
    }

    /**
     * If Doubao response was truncated (e.g. "fluency_issue": "Độ trôi chảy... đầy đủ t), close the string,
     * add missing fields with empty values, and close the object so we can still parse and use the data.
     */
    private static String repairTruncatedJson(String json) {
        if (json == null || json.length() < 10) return null;
        String trimmed = json.trim();
        if (trimmed.endsWith("}")) return null; // already complete
        // Truncated after a value's closing quote: "...", or "...",
        if (trimmed.endsWith("\"")) return trimmed + ", \"improvement_tip\": \"\", \"detailed_errors\": []}";
        if (trimmed.endsWith(",\"")) return trimmed + "\"\", \"detailed_errors\": []}";
        // Truncated after key, before value: "improvement_tip":
        if (trimmed.endsWith(",")) return trimmed + "\"improvement_tip\": \"\", \"detailed_errors\": []}";
        // Cut mid-string: e.g. ... "fluency_issue": "Độ trôi chảy khá tốt, bạn đọc đầy đủ t
        return trimmed + "\", \"improvement_tip\": \"\", \"detailed_errors\": []}";
    }

    private static String text(JsonNode root, String key) {
        JsonNode n = root.path(key);
        if (n.isMissingNode() || n.isNull()) return null;
        String s = n.asText("").trim();
        return s.isEmpty() ? null : s;
    }

    public static StructuredFeedbackDto defaultStructuredFeedback(double score, boolean rejected) {
        StructuredFeedbackDto dto = new StructuredFeedbackDto();
        dto.setOverallFeedback(defaultFeedback(score, rejected));
        dto.setImprovementTip(rejected ? "Hãy ghi âm lại, nói to và rõ hơn." : "Luyện đọc chậm, nhấn đúng thanh điệu.");
        return dto;
    }

    // ─────────────────────────────────────────────────────────────────
    // REST call
    // ─────────────────────────────────────────────────────────────────

    private String callApi(String userPrompt) {
        String payload = buildPayload(userPrompt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(props.getApiKey());

        HttpEntity<String> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    props.getApiUrl(), HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseContent(response.getBody());
            }
            throw new DoubaoApiException("Doubao returned HTTP " + response.getStatusCodeValue());
        } catch (RestClientException e) {
            throw new DoubaoApiException("HTTP call to Doubao failed: " + e.getMessage(), e);
        } catch (DoubaoApiException e) {
            throw e;
        } catch (Exception e) {
            throw new DoubaoApiException("Unexpected error calling Doubao: " + e.getMessage(), e);
        }
    }

    private String buildPayload(String userPrompt) {
        try {
            ObjectNode body = MAPPER.createObjectNode();
            body.put("model",       props.getModel());
            body.put("max_tokens",  props.getMaxTokens());
            body.put("temperature", props.getTemperature());

            ArrayNode messages  = body.putArray("messages");

            ObjectNode systemMsg = messages.addObject();
            systemMsg.put("role",    "system");
            systemMsg.put("content", "Bạn là giám khảo tiếng Trung. Chỉ trả lời bằng tiếng Việt, ngắn gọn và động viên.");

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role",    "user");
            userMsg.put("content", userPrompt);

            return MAPPER.writeValueAsString(body);
        } catch (Exception e) {
            throw new DoubaoApiException("Failed to serialize Doubao request", e);
        }
    }

    private static String parseContent(String responseBody) {
        try {
            JsonNode root    = MAPPER.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                String content = choices.get(0).path("message").path("content").asText("").trim();
                if (!content.isEmpty()) return content;
            }
            throw new DoubaoApiException("Empty 'choices' in Doubao response.");
        } catch (DoubaoApiException e) {
            throw e;
        } catch (Exception e) {
            throw new DoubaoApiException("Failed to parse Doubao response: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Fallback feedback
    // ─────────────────────────────────────────────────────────────────

    public static String defaultFeedback(double score, boolean rejected) {
        if (rejected) return "Ghi âm chưa rõ ràng. Vui lòng ghi âm lại, nói to và rõ hơn.";
        if (score >= 90) return "Phát âm rất chuẩn, thanh điệu rõ, hãy giữ phong độ!";
        if (score >= 80) return "Phát âm khá rõ, có thể luyện thêm cho tự nhiên hơn.";
        if (score >= 70) return "Phát âm ổn, nên luyện thêm thanh điệu và nối âm.";
        if (score >= 60) return "Còn cải thiện được, chú ý thanh điệu và phát âm rõ từ.";
        if (score >= 50) return "Cần luyện thêm, hãy nghe bản mẫu và bắt chước.";
        return "Hãy nghe và luyện nhiều hơn, chú ý phát âm đúng từng âm.";
    }

    /** Backward-compat overload without rejected flag. */
    public static String defaultFeedback(double score) {
        return defaultFeedback(score, false);
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private boolean isConfigured() {
        return props.getApiKey() != null && !props.getApiKey().isBlank();
    }

    private static String truncate(String s) {
        if (s == null) return "";
        return s.length() > MAX_CHARS ? s.substring(0, MAX_CHARS) : s;
    }
}
