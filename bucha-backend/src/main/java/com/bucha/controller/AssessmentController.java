package com.bucha.controller;

import com.bucha.dto.assessment.ExamDetailDTO;
import com.bucha.dto.assessment.ExamSummaryDTO;
import com.bucha.dto.assessment.SubmitExamRequest;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
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
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ExamDetailDTO exam = assessmentService.getExamById(id, principal.id());
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
        Object results = assessmentService.getTestResults(id, principal.id());
        return ResponseEntity.ok(results);
    }
}
