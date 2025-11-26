package com.bucha.controller;

import com.bucha.dto.request.QuizSubmitRequest;
import com.bucha.dto.response.QuizSubmitResponse;
import com.bucha.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Minimal quiz endpoint: evaluates simple answers and returns corrections.
 */
@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping("/submit")
    public ResponseEntity<QuizSubmitResponse> submit(@RequestBody QuizSubmitRequest request) {
        return ResponseEntity.ok(quizService.evaluate(request));
    }
}
