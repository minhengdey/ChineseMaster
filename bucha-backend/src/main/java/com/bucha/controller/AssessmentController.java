package com.bucha.controller;

import com.bucha.dto.assessment.ExamDetailDTO;
import com.bucha.dto.assessment.ExamSummaryDTO;
import com.bucha.dto.assessment.SubmitExamRequest;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
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
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        Long userId = principal != null ? principal.id() : null;
        log.info("Fetching all assessments for user: {}", userId);
        List<ExamSummaryDTO> exams = assessmentService.getAllExams(userId);
        try {
            String json = new ObjectMapper().writeValueAsString(exams);
            log.info("getAllAssessments response: {}", json);
        } catch (Exception e) {
            log.warn("Failed to serialize assessments response: {}", e.getMessage());
        }
        return ResponseEntity.ok(exams);
    }

    /**
     * Get assessment detail by ID
     * GET /api/assessments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExamDetailDTO> getAssessmentById(
            @PathVariable String id,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            log.warn("Unauthorized access attempt to assessment {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = principal.id();
        log.info("Fetching assessment {} for user: {}", id, userId);
        ExamDetailDTO exam = assessmentService.getExamById(id, userId);
        try {
            String json = new ObjectMapper().writeValueAsString(exam);
            log.info("getAssessmentById response: {}", json);
        } catch (Exception e) {
            log.warn("Failed to serialize assessment detail response: {}", e.getMessage());
        }
        return ResponseEntity.ok(exam);
    }

    /**
     * Start assessment - clear old data for fresh start
     * POST /api/assessments/{id}/start
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<Void> startAssessment(
            @PathVariable String id,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.info("Starting assessment {} for user: {}", id, principal.id());
        assessmentService.startAssessment(id, principal.id());
        return ResponseEntity.ok().build();
    }

    /**
     * Submit assessment results
     * POST /api/assessments/{id}/submit
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submitAssessment(
            @PathVariable String id,
            @Valid @RequestBody SubmitExamRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.info("Submitting assessment {} for user: {}, score: {}",
                id, principal.id(), request.getTotalScore());

        // Validate that the assessmentId in path matches the request body
        if (!id.equals(request.getAssessmentId())) {
            return ResponseEntity.badRequest().build();
        }

        assessmentService.submitExamResult(principal.id(), request);
        return ResponseEntity.ok().build();
    }

    /**
     * Get test results for an assessment
     * GET /api/assessments/{id}/results
     */
    @GetMapping("/{id}/results")
    public ResponseEntity<?> getAssessmentResults(
            @PathVariable String id,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.info("Fetching test results for assessment {} and user: {}", id, principal.id());
        Object results = assessmentService.getTestResults(id, principal.id());
        return ResponseEntity.ok(results);
    }
}
