package com.bucha.dto.assessment;

import java.util.List;

/**
 * Quiz result response DTO.
 */
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
