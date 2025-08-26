package com.bucha.dto;

import java.util.List;

public class PronunciationScoreDto {
    public int score;
    public List<SyllableScore> syllables;
    public String feedback;
    public String audioUrl;

    public static class SyllableScore {
        public String text;
        public String expected;
        public boolean matched;
        public double confidence;
    }
}
