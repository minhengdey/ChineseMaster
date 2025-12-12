package com.bucha.controller;

import com.bucha.dto.assessment.ExamDetailDTO;
import com.bucha.dto.assessment.ExamSummaryDTO;
import com.bucha.dto.assessment.SubmitExamRequest;
import com.bucha.entity.UserEntity;
import com.bucha.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
@Slf4j
public class AssessmentController {

    private final AssessmentService assessmentService;

    /**
     * Get all active assessments
     * GET /api/assessments
     */
    @GetMapping
    public ResponseEntity<List<ExamSummaryDTO>> getAllAssessments(
            @AuthenticationPrincipal UserEntity user) {
        Long userId = user != null ? user.getId() : null;
        log.info("Fetching all assessments for user: {}", userId);
        List<ExamSummaryDTO> exams = assessmentService.getAllExams(userId);
        return ResponseEntity.ok(exams);
    }

    /**
     * Get assessment detail by ID
     * GET /api/assessments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExamDetailDTO> getAssessmentById(
            @PathVariable String id,
            @AuthenticationPrincipal UserEntity user) {
        Long userId = user != null ? user.getId() : null;
        log.info("Fetching assessment {} for user: {}", id, userId);
        ExamDetailDTO exam = assessmentService.getExamById(id, userId);
        return ResponseEntity.ok(exam);
    }

    /**
     * Submit assessment results
     * POST /api/assessments/{id}/submit
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submitAssessment(
            @PathVariable String id,
            @Valid @RequestBody SubmitExamRequest request,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.info("Submitting assessment {} for user: {}, score: {}",
                id, user.getId(), request.getTotalScore());

        // Validate that the assessmentId in path matches the request body
        if (!id.equals(request.getAssessmentId())) {
            return ResponseEntity.badRequest().build();
        }

        assessmentService.submitExamResult(user.getId(), request);
        return ResponseEntity.ok().build();
    }
}
