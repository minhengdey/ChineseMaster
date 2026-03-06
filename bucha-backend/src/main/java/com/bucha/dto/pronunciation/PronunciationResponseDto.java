package com.bucha.dto.pronunciation;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response payload for {@code POST /api/pronunciation/evaluate}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PronunciationResponseDto {

    /** Overall pronunciation score in the range [0, 100]. */
    private final double score;

    /** AI-generated feedback sentence (≤ 100 Chinese characters). */
    private final String feedback;

    /** Fluency sub-score. Null when iFlytek did not provide it. */
    private final Double fluency;

    /** Completeness/integrity sub-score. Null when not provided. */
    private final Double completeness;

    /** Full ISE JSON (sentence, words, etc.) for detailed UI. Null when not provided. */
    private final Object rawIseData;

    /** Structured AI feedback (HSKK judge style). */
    private final String overallFeedback;
    private final String pronunciationIssue;
    private final String toneIssue;
    private final String fluencyIssue;
    private final String improvementTip;

    private PronunciationResponseDto(Builder b) {
        this.score             = b.score;
        this.feedback          = b.feedback;
        this.fluency           = b.fluency;
        this.completeness      = b.completeness;
        this.rawIseData        = b.rawIseData;
        this.overallFeedback   = b.overallFeedback;
        this.pronunciationIssue = b.pronunciationIssue;
        this.toneIssue         = b.toneIssue;
        this.fluencyIssue      = b.fluencyIssue;
        this.improvementTip    = b.improvementTip;
    }

    public double  getScore()              { return score; }
    public String  getFeedback()           { return feedback; }
    public Double  getFluency()            { return fluency; }
    public Double  getCompleteness()        { return completeness; }
    public Object  getRawIseData()         { return rawIseData; }
    public String  getOverallFeedback()   { return overallFeedback; }
    public String  getPronunciationIssue() { return pronunciationIssue; }
    public String  getToneIssue()           { return toneIssue; }
    public String  getFluencyIssue()       { return fluencyIssue; }
    public String  getImprovementTip()     { return improvementTip; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private double score;
        private String feedback;
        private Double fluency;
        private Double completeness;
        private Object rawIseData;
        private String overallFeedback;
        private String pronunciationIssue;
        private String toneIssue;
        private String fluencyIssue;
        private String improvementTip;

        public Builder score(double v)              { this.score = v;             return this; }
        public Builder feedback(String v)           { this.feedback = v;          return this; }
        public Builder fluency(Double v)             { this.fluency = v;          return this; }
        public Builder completeness(Double v)        { this.completeness = v;     return this; }
        public Builder rawIseData(Object v)         { this.rawIseData = v;       return this; }
        public Builder overallFeedback(String v)     { this.overallFeedback = v;  return this; }
        public Builder pronunciationIssue(String v) { this.pronunciationIssue = v; return this; }
        public Builder toneIssue(String v)           { this.toneIssue = v;        return this; }
        public Builder fluencyIssue(String v)        { this.fluencyIssue = v;     return this; }
        public Builder improvementTip(String v)      { this.improvementTip = v;   return this; }
        public PronunciationResponseDto build() { return new PronunciationResponseDto(this); }
    }
}
