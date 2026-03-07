package com.bucha.controller;

import com.bucha.dto.hskk.*;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.HSKKService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/hskk")
@RequiredArgsConstructor
public class HSKKController {

    private final HSKKService hskkService;

    @GetMapping("/questions")
    public ResponseEntity<HSKKQuestionsByPartDto> getQuestions() {
        return ResponseEntity.ok(hskkService.getQuestions());
    }

    @PostMapping("/start-exam")
    public ResponseEntity<HSKKExamResultDto> startExam(@AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(hskkService.startExam(principal));
    }

    @PostMapping(value = "/submit-answer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubmitHSKKAnswerResponse> submitAnswer(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam("examResultId") Long examResultId,
            @RequestParam("questionId") Long questionId,
            @RequestParam(value = "referenceText", required = false) String referenceText,
            @RequestParam("audio") MultipartFile audio) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            SubmitHSKKAnswerResponse response = hskkService.submitAnswer(
                    principal, examResultId, questionId, referenceText, audio);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(SubmitHSKKAnswerResponse.builder()
                            .pronunciationScore(0.0)
                            .aiFeedback(e.getMessage())
                            .answerId(null)
                            .build());
        }
    }

    @PostMapping("/finish-exam")
    public ResponseEntity<HSKKExamResultDto> finishExam(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody FinishHSKKExamRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(hskkService.finishExam(principal, request.getExamResultId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<HSKKExamResultDto>> getHistory(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(hskkService.getHistory(principal, Math.min(limit, 50)));
    }
}
