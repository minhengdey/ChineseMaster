package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parsed JSON from Doubao AI for HSKK Part 2 evaluation (snake_case keys from API).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Part2DoubaoResult {
    private String content_evaluation;
    private String fluency_comment;
    private String pronunciation_comment;
    private String improvement_tip;
    private String sample_answer;
    /** Điểm chấm cho câu trả lời (0–100) từ Doubao. */
    private Double content_score;
}
