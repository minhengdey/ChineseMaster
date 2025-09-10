package com.bucha.dto;

import java.util.List;

public class QuizResultDto {
    public int score;
    public int total;
    public List<Correction> corrections;

    public static class Correction {
        public Long questionId;
        public String yourAnswer;
        public String correctAnswer;
        public boolean correct;
    }
}
