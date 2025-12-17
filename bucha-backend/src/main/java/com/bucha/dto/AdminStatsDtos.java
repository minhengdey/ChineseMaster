package com.bucha.dto;

import java.time.LocalDate;
import java.util.List;

public class AdminStatsDtos {
    public record UserScoreRow(Long userId, String name, String email, double avgScore, long attempts,
            double bestScore) {
    }

    public record WeeklyLeaderboard(int weekIndex, LocalDate weekStart, LocalDate weekEnd, List<UserScoreRow> rows) {
    }

    public record LessonLeaderboard(Long lessonId, String lessonTitle, List<UserScoreRow> rows) {
    }

    public record TestLeaderboard(Long testId, List<UserScoreRow> rows) {
    }

    public record ExamScoreRow(Long userId, String name, String email, Double initialScore, Double finalScore,
            Double toneScore, Double sentenceScore, Double totalScore, Long examId, String examTitle) {
    }

    public record ExamLeaderboard(Long examId, String examTitle, List<ExamScoreRow> rows) {
    }
}
