package com.bucha.controller;

import com.bucha.dto.hskk.Part3Response;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.SpeakingEvaluationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * HSKK Sơ cấp Part 3: submit answer (nói tự do, tối đa 1.5 phút).
 * Flow: audio → IAT (speech-to-text) → pronunciation scoring (ISE) → Doubao AI → transcript + scores + feedback.
 * On IAT failure, {@link com.bucha.exception.GlobalExceptionHandler} returns 422 with message
 * "Không nhận diện được giọng nói, vui lòng thử lại."
 */
@RestController
@RequestMapping("/api/hskk/part3")
public class HskkPart3Controller {

    private final SpeakingEvaluationService speakingEvaluationService;

    public HskkPart3Controller(SpeakingEvaluationService speakingEvaluationService) {
        this.speakingEvaluationService = speakingEvaluationService;
    }

    /**
     * Submit Part 3 answer: question text + recorded audio.
     * Returns transcript, pronunciation scores (total, pronunciation, tone, fluency), and AI evaluation.
     */
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Part3Response> submit(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam("questionText") String questionText,
            @RequestParam("audioFile") MultipartFile audioFile) {

        if (audioFile == null || audioFile.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Part3Response response = speakingEvaluationService.evaluatePart3(
                questionText, audioFile, principal);
        return ResponseEntity.ok(response);
    }
}
