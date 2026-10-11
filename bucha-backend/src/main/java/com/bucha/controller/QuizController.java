package com.bucha.controller;

import com.bucha.dto.assessment.QuizResultDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * Minimal quiz endpoint: evaluates simple answers and returns corrections.
 */
@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @PostMapping("/submit")
    public ResponseEntity<QuizResultDto> submit(@RequestBody Map<String, Object> payload) {
        var answers = (List<Map<String, Object>>) payload.getOrDefault("answers", Collections.emptyList());
        int score = 0;
        List<QuizResultDto.Correction> corrections = new ArrayList<>();
        for (Map<String, Object> ans : answers) {
            String given = String.valueOf(ans.get("answer"));
            boolean correct = "A".equalsIgnoreCase(given);
            if (correct)
                score++;
            QuizResultDto.Correction c = new QuizResultDto.Correction();
            c.questionId = ans.get("questionId") == null ? null : Long.valueOf(ans.get("questionId").toString());
            c.yourAnswer = given;
            c.correctAnswer = "A";
            c.correct = correct;
            corrections.add(c);
        }
        QuizResultDto dto = new QuizResultDto();
        dto.score = score;
        dto.total = answers.size();
        dto.corrections = corrections;
        return ResponseEntity.ok(dto);
    }
}
