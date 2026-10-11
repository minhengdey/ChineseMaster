package com.bucha.client;

/**
 * Typed result returned by {@link IflytekClient}.
 * Carries the pronunciation score and optional extra diagnostics.
 */
public class IflytekEvaluationResult {

    /** Overall pronunciation score in the range [0, 100]. */
    private final double totalScore;

    /** Fluency sub-score (0–100), or -1 if not available. */
    private final double fluencyScore;

    /** Completeness/integrity sub-score (0–100), or -1 if not available. */
    private final double completenessScore;

    /** True when iFlytek flagged the recording as too poor to score accurately. */
    private final boolean rejected;

    /** ISE session id for tracing. May be null. */
    private final String sessionId;

    private IflytekEvaluationResult(Builder b) {
        this.totalScore        = b.totalScore;
        this.fluencyScore      = b.fluencyScore;
        this.completenessScore = b.completenessScore;
        this.rejected          = b.rejected;
        this.sessionId         = b.sessionId;
    }

    public double getTotalScore()        { return totalScore; }
    public double getFluencyScore()      { return fluencyScore; }
    public double getCompletenessScore() { return completenessScore; }
    public boolean isRejected()          { return rejected; }
    public String getSessionId()         { return sessionId; }

    @Override
    public String toString() {
        return "IflytekEvaluationResult{totalScore=" + totalScore
                + ", fluency=" + fluencyScore
                + ", completeness=" + completenessScore
                + ", rejected=" + rejected
                + ", sid=" + sessionId + "}";
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private double totalScore        = 0.0;
        private double fluencyScore      = -1.0;
        private double completenessScore = -1.0;
        private boolean rejected         = false;
        private String sessionId         = null;

        public Builder totalScore(double v)        { this.totalScore = v;        return this; }
        public Builder fluencyScore(double v)      { this.fluencyScore = v;      return this; }
        public Builder completenessScore(double v) { this.completenessScore = v; return this; }
        public Builder rejected(boolean v)         { this.rejected = v;          return this; }
        public Builder sessionId(String v)         { this.sessionId = v;         return this; }
        public IflytekEvaluationResult build()     { return new IflytekEvaluationResult(this); }
    }
}
