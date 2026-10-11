package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitHSKKAnswerResponse {
    private Double pronunciationScore;
    /** Legacy: overall feedback text (same as overallFeedback). */
    private String aiFeedback;
    private Long answerId;
    /**
     * Full iFlytek ISE result forwarded to the frontend.
     * Same structure as POST /api/ise/score response:
     * { sentence: { total_score, fluency, completeness, wrong_words, is_rejected }, words: [...] }
     */
    private Object iseResult;
    /** Structured AI feedback (HSKK judge style). */
    private String overallFeedback;
    private String pronunciationIssue;
    private String toneIssue;
    private String fluencyIssue;
    private String improvementTip;
}
