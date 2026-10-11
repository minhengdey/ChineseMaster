package com.bucha.controller;

import com.bucha.dto.hskk.Part2Response;
import com.bucha.service.SpeakingEvaluationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * HSKK Sơ cấp Part 2: submit answer (audio + question text) and get evaluation.
 * Flow: audio → IAT (speech-to-text) → Doubao AI → transcript + feedback.
 * On IAT failure (no speech recognized), {@link com.bucha.exception.GlobalExceptionHandler}
 * returns 422 with message "Không nhận diện được giọng nói, vui lòng thử lại."
 */
@RestController
@RequestMapping("/api/hskk/part2")
public class HskkPart2Controller {

    private final SpeakingEvaluationService speakingEvaluationService;

    public HskkPart2Controller(SpeakingEvaluationService speakingEvaluationService) {
        this.speakingEvaluationService = speakingEvaluationService;
    }

    /**
     * Submit Part 2 answer: question text + recorded audio.
     * Returns transcript and AI evaluation (content, fluency, pronunciation, improvement tip, sample answer).
     */
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Part2Response> submit(
            @RequestParam("questionText") String questionText,
            @RequestParam("audioFile") MultipartFile audioFile) {

        if (audioFile == null || audioFile.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Part2Response response = speakingEvaluationService.evaluatePart2(questionText, audioFile);
        return ResponseEntity.ok(response);
    }
}
