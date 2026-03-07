package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for HSKK Part 2 submit: transcript from IAT + Doubao AI evaluation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Part2Response {
    /** Bản ghi âm đã nhận diện (từ iFlytek IAT). */
    private String transcript;
    /** Điểm chấm cho câu trả lời (0–100) từ Doubao AI. */
    private Double contentScore;
    /** Đánh giá nội dung câu trả lời so với câu hỏi. */
    private String contentEvaluation;
    /** Nhận xét độ lưu loát. */
    private String fluencyComment;
    /** Nhận xét phát âm (tổng quan). */
    private String pronunciationComment;
    /** Gợi ý cải thiện. */
    private String improvementTip;
    /** Câu trả lời mẫu đơn giản (HSK3). */
    private String sampleAnswer;
}
