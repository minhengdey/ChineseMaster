package com.bucha.dto.pronunciation;

/**
 * Parsed result from iFlytek ISE evaluation.
 * Carries all sub-scores used to build the Doubao AI prompt.
 */
public class SpeechEvaluationResult {

    /** Overall pronunciation score [0, 100]. */
    private double totalScore;

    /**
     * Phone / initial-consonant accuracy score [0, 100].
     * Computed as the average of per-word initial_score values from ISE.
     * 0 when ISE did not return word-level details.
     */
    private double phoneScore;

    /**
     * Tone accuracy score [0, 100].
     * Computed as the average of per-word tone_score values from ISE.
     * 0 when ISE did not return word-level details.
     */
    private double toneScore;

    /** Sentence fluency score [0, 100] from ISE sentence node. */
    private double fluencyScore;

    /** Completeness / integrity score [0, 100] from ISE sentence node. */
    private double completenessScore;

    /** True when ISE flagged the recording as too poor to score reliably. */
    private boolean rejected;

    /** The reference text that was evaluated. */
    private String sentence;

    /**
     * Full parsed ISE response as a plain Java Object (Map / List tree).
     * Jackson-serialized and forwarded directly to the frontend so it can render
     * the same detailed score UI used by other practice screens.
     */
    private Object rawIseData;

    public SpeechEvaluationResult() {}

    // ── Getters & setters ──────────────────────────────────────────────

    public double getTotalScore()        { return totalScore; }
    public void   setTotalScore(double v){ this.totalScore = v; }

    public double getPhoneScore()        { return phoneScore; }
    public void   setPhoneScore(double v){ this.phoneScore = v; }

    public double getToneScore()         { return toneScore; }
    public void   setToneScore(double v) { this.toneScore = v; }

    public double getFluencyScore()         { return fluencyScore; }
    public void   setFluencyScore(double v) { this.fluencyScore = v; }

    public double getCompletenessScore()         { return completenessScore; }
    public void   setCompletenessScore(double v) { this.completenessScore = v; }

    public boolean isRejected()          { return rejected; }
    public void    setRejected(boolean v){ this.rejected = v; }

    public String getSentence()          { return sentence; }
    public void   setSentence(String v)  { this.sentence = v; }

    public Object getRawIseData()          { return rawIseData; }
    public void   setRawIseData(Object v)  { this.rawIseData = v; }

    @Override
    public String toString() {
        return "SpeechEvaluationResult{totalScore=" + totalScore
                + ", phoneScore=" + phoneScore
                + ", toneScore=" + toneScore
                + ", fluencyScore=" + fluencyScore
                + ", completenessScore=" + completenessScore
                + ", rejected=" + rejected
                + ", sentence='" + sentence + "'}";
    }
}
