package com.bucha.service;

import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Calls Doubao AI to generate a short Vietnamese feedback comment for an HSKK answer.
 * Sends structured pronunciation sub-scores so the model gives a precise, actionable comment.
 */
@Service
public class AICommentService {

    private static final Logger logger = LoggerFactory.getLogger(AICommentService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_FEEDBACK_CHARS = 300;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${doubao.api-url:https://api.doubao-ai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${doubao.api-key:}")
    private String apiKey;

    @Value("${doubao.model:doubao-pro-32k}")
    private String model;

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    /**
     * Generate Vietnamese feedback using rich sub-scores from ISE.
     *
     * @param eval parsed ISE result (all sub-scores + rejected flag)
     * @return feedback in Vietnamese, ≤ 300 chars; never null
     */
    public String generateFeedback(SpeechEvaluationResult eval) {
        if (apiKey == null || apiKey.isBlank()) {
            logger.debug("Doubao API key not configured, using default feedback");
            return defaultFeedback(eval.getTotalScore(), eval.isRejected());
        }
        try {
            String prompt = buildPrompt(eval);
            String feedback = callApi(prompt);
            return feedback.length() > MAX_FEEDBACK_CHARS
                    ? feedback.substring(0, MAX_FEEDBACK_CHARS)
                    : feedback;
        } catch (Exception e) {
            logger.warn("Doubao API call failed: {}", e.getMessage());
            return defaultFeedback(eval.getTotalScore(), eval.isRejected());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Prompt builder — mirrors the exact format the user specified
    // ─────────────────────────────────────────────────────────────────

    static String buildPrompt(SpeechEvaluationResult eval) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là giám khảo HSKK sơ cấp.\n\n");
        sb.append("Câu cần đọc:\n");
        sb.append(eval.getSentence() != null ? eval.getSentence() : "").append("\n\n");
        sb.append("Kết quả đánh giá phát âm:\n\n");

        if (eval.getPhoneScore() > 0) {
            sb.append(String.format("Phone score: %.2f%n", eval.getPhoneScore()));
        }
        if (eval.getToneScore() > 0) {
            sb.append(String.format("Tone score: %.2f%n", eval.getToneScore()));
        }
        sb.append(String.format("Fluency score: %.2f%n", eval.getFluencyScore()));
        sb.append(String.format("Total score: %.2f%n", eval.getTotalScore()));
        sb.append(String.format("Audio rejected: %b%n", eval.isRejected()));

        sb.append("\nHãy viết nhận xét ngắn dưới 100 chữ giúp người học cải thiện phát âm. ");
        sb.append("Nếu audio không hợp lệ thì hãy nhắc người học ghi âm lại rõ ràng hơn. ");
        sb.append("Chỉ trả lời bằng tiếng Việt.");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────
    // HTTP call
    // ─────────────────────────────────────────────────────────────────

    private String callApi(String prompt) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", 200);
        body.put("temperature", 0.5);

        ArrayNode messages = body.putArray("messages");

        ObjectNode systemMsg = messages.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", "Bạn là giám khảo tiếng Trung. Chỉ trả lời bằng tiếng Việt, ngắn gọn và động viên.");

        ObjectNode userMsg = messages.addObject();
        userMsg.put("role", "user");
        userMsg.put("content", prompt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<String> entity = new HttpEntity<>(MAPPER.writeValueAsString(body), headers);

        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, HttpMethod.POST, entity, String.class);

        if (response.getBody() == null) {
            throw new IllegalStateException("Empty response from Doubao");
        }
        JsonNode root = MAPPER.readTree(response.getBody());
        JsonNode choices = root.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            String content = choices.get(0).path("message").path("content").asText("").trim();
            if (!content.isEmpty()) return content;
        }
        throw new IllegalStateException("No content in Doubao response");
    }

    // ─────────────────────────────────────────────────────────────────
    // Fallback
    // ─────────────────────────────────────────────────────────────────

    static String defaultFeedback(double score, boolean rejected) {
        if (rejected) return "Ghi âm chưa rõ ràng. Vui lòng ghi âm lại, nói to và rõ hơn.";
        if (score >= 85) return "Phát âm tốt, hãy tiếp tục phát huy!";
        if (score >= 70) return "Phát âm ổn, luyện thêm sẽ tốt hơn.";
        if (score >= 60) return "Còn cải thiện được, chú ý thanh điệu và độ rõ.";
        return "Hãy nghe và luyện nhiều, bắt chước phát âm chuẩn.";
    }
}
