package com.bucha.dto.pronunciation;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Structured AI feedback from Doubao (HSKK judge style).
 * Used for pronunciation evaluation and HSKK answer feedback.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StructuredFeedbackDto {

    /** Overall feedback, under 100 chars. */
    private String overallFeedback;
    /** Pronunciation (consonant/vowel) issue if any. */
    private String pronunciationIssue;
    /** Tone issue if any. */
    private String toneIssue;
    /** Fluency issue if any. */
    private String fluencyIssue;
    /** Suggestion for practice. */
    private String improvementTip;

    public StructuredFeedbackDto() {}

    public String getOverallFeedback() { return overallFeedback; }
    public void setOverallFeedback(String v) { this.overallFeedback = v; }

    public String getPronunciationIssue() { return pronunciationIssue; }
    public void setPronunciationIssue(String v) { this.pronunciationIssue = v; }

    public String getToneIssue() { return toneIssue; }
    public void setToneIssue(String v) { this.toneIssue = v; }

    public String getFluencyIssue() { return fluencyIssue; }
    public void setFluencyIssue(String v) { this.fluencyIssue = v; }

    public String getImprovementTip() { return improvementTip; }
    public void setImprovementTip(String v) { this.improvementTip = v; }
}
