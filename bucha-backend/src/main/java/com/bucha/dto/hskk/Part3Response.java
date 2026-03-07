package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for HSKK Part 3 submit: transcript + pronunciation scores (ISE) + Doubao AI evaluation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Part3Response {
    /** Bản ghi âm đã nhận diện (từ iFlytek IAT). */
    private String transcript;
    /** Điểm tổng từ ISE. */
    private Double totalScore;
    /** Điểm phát âm (thanh mẫu/vận mẫu). */
    private Double pronunciationScore;
    /** Điểm thanh điệu. */
    private Double toneScore;
    /** Điểm độ trôi chảy. */
    private Double fluencyScore;
    /** Đánh giá nội dung câu trả lời (Doubao). */
    private String contentEvaluation;
    /** Nhận xét độ lưu loát (Doubao). */
    private String fluencyComment;
    /** Nhận xét phát âm (Doubao). */
    private String pronunciationComment;
    /** Gợi ý cải thiện (Doubao). */
    private String improvementTip;
    /** Câu trả lời mẫu 5–6 câu, trình độ HSK3 (Doubao). */
    private String sampleAnswer;
}
