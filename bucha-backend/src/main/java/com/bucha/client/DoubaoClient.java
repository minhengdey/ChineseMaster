package com.bucha.client;

import com.bucha.config.DoubaoProperties;
import com.bucha.dto.hskk.Part2DoubaoResult;
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
import org.springframework.web.client.HttpStatusCodeException;
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
     * Evaluate HSKK Part 3 answer: question + transcript + pronunciation/fluency scores → content/fluency/pronunciation/sample (5–6 câu).
     * Same JSON shape as Part 2; sample_answer is longer (5–6 sentences).
     */
    public Part2DoubaoResult evaluatePart3(String questionText, String transcript, double pronunciationScore, double fluencyScore) {
        if (!isConfigured()) {
            logger.debug("[DoubaoClient] API key not configured – returning default Part3 result");
            return defaultPart2Result();
        }
        try {
            String prompt = buildPart3Prompt(questionText, transcript, pronunciationScore, fluencyScore);
            String content = callApi(prompt);
            Part2DoubaoResult parsed = parsePart2Json(content);
            if (parsed != null) return parsed;
        } catch (DoubaoApiException e) {
            if (e.getCause() instanceof HttpStatusCodeException) {
                int code = ((HttpStatusCodeException) e.getCause()).getStatusCode().value();
                if (code == 429) {
                    logger.warn("[DoubaoClient] Part3 rate limited (429), returning friendly message.");
                    return defaultPart2ResultForRateLimit();
                }
            }
            logger.warn("[DoubaoClient] Part3 API call failed ({}), using default.", e.getMessage());
        }
        return defaultPart2Result();
    }

    /**
     * Evaluate HSKK Part 2 answer: question + transcript → content/fluency/pronunciation/sample.
     * Builds prompt with questionText and transcript, calls API, parses JSON into Part2DoubaoResult.
     */
    public Part2DoubaoResult evaluatePart2(String questionText, String transcript) {
        if (!isConfigured()) {
            logger.debug("[DoubaoClient] API key not configured – returning default Part2 result");
            return defaultPart2Result();
        }
        try {
            String prompt = buildPart2Prompt(questionText, transcript);
            String content = callApi(prompt);
            Part2DoubaoResult parsed = parsePart2Json(content);
            if (parsed != null) return parsed;
        } catch (DoubaoApiException e) {
            if (e.getCause() instanceof HttpStatusCodeException) {
                int code = ((HttpStatusCodeException) e.getCause()).getStatusCode().value();
                if (code == 429) {
                    logger.warn("[DoubaoClient] Part2 rate limited (429), returning friendly message.");
                    return defaultPart2ResultForRateLimit();
                }
            }
            logger.warn("[DoubaoClient] Part2 API call failed ({}), using default.", e.getMessage());
        }
        return defaultPart2Result();
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

        sb.append("Bạn là giám khảo kỳ thi HSKK Sơ cấp và giáo viên dạy phát âm tiếng Trung.\n");
        sb.append("Nhiệm vụ của bạn là phân tích lỗi phát âm của người học dựa trên điểm số hệ thống.\n\n");

        sb.append("=== DỮ LIỆU PHÁT ÂM ===\n");

        sb.append("Sentence: ").append(sentence).append("\n\n");

        sb.append("Scores:\n");
        sb.append("Total: ").append(String.format("%.2f", total)).append("\n");
        sb.append("Pronunciation: ").append(String.format("%.2f", phone)).append("\n");
        sb.append("Tone: ").append(String.format("%.2f", tone)).append("\n");
        sb.append("Fluency: ").append(String.format("%.2f", fluency)).append("\n\n");

        sb.append("Word analysis:\n");
        sb.append(wordAnalysis).append("\n\n");

        sb.append("=== YÊU CẦU PHÂN TÍCH ===\n");

        sb.append("1. overall_feedback\n");
        sb.append("- Nhận xét tổng thể dưới 100 chữ.\n");

        sb.append("2. pronunciation_issue\n");
        sb.append("- Phân tích lỗi thanh mẫu (initial) hoặc vận mẫu (final).\n");
        sb.append("- Ví dụ thanh mẫu: zh ch sh r z c s j q x\n");
        sb.append("- Ví dụ vận mẫu: a e i u ü ang eng ong\n");
        sb.append("- Nếu lỗi lặp lại nhiều lần thì phải nói rõ.\n\n");

        sb.append("3. tone_issue\n");
        sb.append("- Phân tích lỗi thanh điệu.\n");
        sb.append("- Nêu rõ thanh đúng (1,2,3,4).\n");
        sb.append("- So sánh với thanh người học nói.\n\n");

        sb.append("4. fluency_issue\n");
        sb.append("- Nhận xét tốc độ nói, ngắt nghỉ và độ trôi chảy.\n\n");

        sb.append("5. detailed_errors\n");
        sb.append("- Liệt kê từng chữ Hán phát âm sai.\n");
        sb.append("- Nếu không có lỗi thì trả về mảng rỗng [].\n\n");

        sb.append("6. improvement_tip\n");
        sb.append("- Đưa ra lời khuyên luyện tập ngắn gọn.\n\n");

        sb.append("=== FORMAT TRẢ VỀ ===\n");
        sb.append("Chỉ trả về JSON hợp lệ, KHÔNG thêm giải thích.\n");

        sb.append("{\n");
        sb.append("  \"overall_feedback\": \"...\",\n");
        sb.append("  \"pronunciation_issue\": \"...\",\n");
        sb.append("  \"tone_issue\": \"...\",\n");
        sb.append("  \"fluency_issue\": \"...\",\n");
        sb.append("  \"improvement_tip\": \"...\",\n");
        sb.append("  \"detailed_errors\": [\n");
        sb.append("    {\n");
        sb.append("      \"character\": \"...\",\n");
        sb.append("      \"pinyin_correct\": \"...\",\n");
        sb.append("      \"tone_correct\": \"...\",\n");
        sb.append("      \"tone_spoken\": \"...\",\n");
        sb.append("      \"issue\": \"...\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");

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

    private static Double extractDouble(JsonNode root, String key) {
        JsonNode n = root.path(key);
        if (n.isMissingNode() || n.isNull() || !n.isNumber()) return null;
        double v = n.asDouble();
        if (Double.isNaN(v) || v < 0) return 0.0;
        if (v > 100) return 100.0;
        return v;
    }

    // ─────────────────────────────────────────────────────────────────
    // Part 2: question + transcript → evaluation JSON
    // ─────────────────────────────────────────────────────────────────

    static String buildPart2Prompt(String questionText, String transcript) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là giám khảo kỳ thi HSKK Sơ cấp Part 2 (trả lời câu hỏi).\n\n");
        sb.append("=== CÂU HỎI ===\n").append(questionText != null ? questionText : "").append("\n\n");
        sb.append("=== CÂU TRẢ LỜI CỦA NGƯỜI HỌC (đã nhận diện giọng nói) ===\n").append(transcript != null ? transcript : "").append("\n\n");
        sb.append("=== YÊU CẦU ===\n");
        sb.append("1. content_score: Chấm điểm cho câu trả lời đó từ 0 đến 100 (một số nguyên hoặc thập phân). Điểm càng cao càng đúng nội dung, đủ ý, phù hợp câu hỏi.\n");
        sb.append("2. content_evaluation: Đánh giá câu trả lời có đúng nội dung câu hỏi không (ngắn gọn, tiếng Việt).\n");
        sb.append("3. fluency_comment: Nhận xét độ lưu loát.\n");
        sb.append("4. pronunciation_comment: Nhận xét phát âm tổng quan (không có điểm chi tiết từng từ).\n");
        sb.append("5. improvement_tip: Gợi ý cải thiện.\n");
        sb.append("6. sample_answer: Đưa ra một câu trả lời mẫu đơn giản, trình độ HSK3, bằng tiếng Trung.\n\n");
        sb.append("=== FORMAT TRẢ VỀ ===\n");
        sb.append("Chỉ trả về JSON hợp lệ, KHÔNG thêm giải thích.\n");
        sb.append("{\n");
        sb.append("  \"content_score\": 75,\n");
        sb.append("  \"content_evaluation\": \"...\",\n");
        sb.append("  \"fluency_comment\": \"...\",\n");
        sb.append("  \"pronunciation_comment\": \"...\",\n");
        sb.append("  \"improvement_tip\": \"...\",\n");
        sb.append("  \"sample_answer\": \"...\"\n");
        sb.append("}\n\n");
        sb.append("Tất cả nội dung (trừ sample_answer) phải viết bằng tiếng Việt. content_score phải là số.\n");
        return sb.toString();
    }

    /**
     * Part 3 prompt: question + transcript + pronunciation/fluency scores; sample_answer 5–6 câu.
     */
    static String buildPart3Prompt(String questionText, String transcript, double pronunciationScore, double fluencyScore) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là giám khảo kỳ thi HSKK Sơ cấp Part 3 (nói tự do, 1.5 phút).\n\n");
        sb.append("=== CÂU HỎI ===\n").append(questionText != null ? questionText : "").append("\n\n");
        sb.append("=== CÂU TRẢ LỜI CỦA NGƯỜI HỌC (đã nhận diện giọng nói) ===\n").append(transcript != null ? transcript : "").append("\n\n");
        sb.append("=== ĐIỂM PHÁT ÂM (từ hệ thống) ===\n");
        sb.append("pronunciationScore: ").append(String.format("%.2f", pronunciationScore)).append("\n");
        sb.append("fluencyScore: ").append(String.format("%.2f", fluencyScore)).append("\n\n");
        sb.append("=== YÊU CẦU ===\n");
        sb.append("1. content_evaluation: Đánh giá nội dung câu trả lời so với câu hỏi (ngắn gọn, tiếng Việt).\n");
        sb.append("2. fluency_comment: Nhận xét độ lưu loát.\n");
        sb.append("3. pronunciation_comment: Nhận xét phát âm tổng quan (dựa trên điểm pronunciationScore và fluencyScore).\n");
        sb.append("4. improvement_tip: Gợi ý cải thiện.\n");
        sb.append("5. sample_answer: Đưa ra câu trả lời mẫu gồm 5–6 câu đơn giản, trình độ HSK3, bằng tiếng Trung.\n\n");
        sb.append("=== FORMAT TRẢ VỀ ===\n");
        sb.append("Chỉ trả về JSON hợp lệ, KHÔNG thêm giải thích.\n");
        sb.append("{\n");
        sb.append("  \"content_evaluation\": \"...\",\n");
        sb.append("  \"fluency_comment\": \"...\",\n");
        sb.append("  \"pronunciation_comment\": \"...\",\n");
        sb.append("  \"improvement_tip\": \"...\",\n");
        sb.append("  \"sample_answer\": \"...\"\n");
        sb.append("}\n\n");
        sb.append("Tất cả nội dung (trừ sample_answer) phải viết bằng tiếng Việt.\n");
        return sb.toString();
    }

    private static Part2DoubaoResult parsePart2Json(String content) {
        if (content == null || content.isBlank()) return null;
        String json = content.trim();
        var m = JSON_BLOCK.matcher(json);
        if (m.find()) json = m.group(1).trim();
        try {
            JsonNode root = MAPPER.readTree(json);
            Part2DoubaoResult dto = new Part2DoubaoResult();
            dto.setContent_score(extractDouble(root, "content_score"));
            dto.setContent_evaluation(text(root, "content_evaluation"));
            dto.setFluency_comment(text(root, "fluency_comment"));
            dto.setPronunciation_comment(text(root, "pronunciation_comment"));
            dto.setImprovement_tip(text(root, "improvement_tip"));
            dto.setSample_answer(text(root, "sample_answer"));
            return dto;
        } catch (Exception e) {
            logger.debug("[DoubaoClient] Failed to parse Part2 JSON: {}", e.getMessage());
            return null;
        }
    }

    private static Part2DoubaoResult defaultPart2Result() {
        Part2DoubaoResult dto = new Part2DoubaoResult();
        dto.setContent_evaluation("Không thể đánh giá nội dung.");
        dto.setFluency_comment("—");
        dto.setPronunciation_comment("—");
        dto.setImprovement_tip("Hãy thử lại khi có kết nối AI.");
        dto.setSample_answer("请再说一遍。");
        return dto;
    }

    /** Used when Doubao returns 429 Too Many Requests. */
    private static Part2DoubaoResult defaultPart2ResultForRateLimit() {
        Part2DoubaoResult dto = new Part2DoubaoResult();
        dto.setContent_evaluation("AI tạm thời quá tải (giới hạn lượt gọi).");
        dto.setFluency_comment("—");
        dto.setPronunciation_comment("—");
        dto.setImprovement_tip("Vui lòng thử lại sau vài phút hoặc giảm tần suất gửi bài.");
        dto.setSample_answer("请再说一遍。");
        return dto;
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

    private static final int RETRY_DELAY_MS = 5_000;
    private static final int MAX_ATTEMPTS = 2;

    private String callApi(String userPrompt) {
        String payload = buildPayload(userPrompt);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(props.getApiKey());
        HttpEntity<String> entity = new HttpEntity<>(payload, headers);

        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        props.getApiUrl(), HttpMethod.POST, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return parseContent(response.getBody());
                }
                lastException = new DoubaoApiException("Doubao returned HTTP " + response.getStatusCodeValue());
            } catch (HttpStatusCodeException e) {
                lastException = e;
                if (e.getStatusCode().value() == 429 && attempt < MAX_ATTEMPTS) {
                    logger.warn("[DoubaoClient] 429 Too Many Requests, retrying in {}s (attempt {}/{})",
                            RETRY_DELAY_MS / 1000, attempt, MAX_ATTEMPTS);
                    try {
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new DoubaoApiException("Interrupted while waiting to retry", ie);
                    }
                    continue;
                }
                throw new DoubaoApiException("HTTP call to Doubao failed: " + e.getMessage(), e);
            } catch (RestClientException e) {
                throw new DoubaoApiException("HTTP call to Doubao failed: " + e.getMessage(), e);
            } catch (DoubaoApiException e) {
                throw e;
            } catch (Exception e) {
                throw new DoubaoApiException("Unexpected error calling Doubao: " + e.getMessage(), e);
            }
        }
        if (lastException != null) {
            throw lastException instanceof DoubaoApiException ? (DoubaoApiException) lastException
                    : new DoubaoApiException("HTTP call to Doubao failed: " + lastException.getMessage(), lastException);
        }
        throw new DoubaoApiException("Doubao request failed after " + MAX_ATTEMPTS + " attempts");
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
