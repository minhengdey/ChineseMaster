package com.bucha.controller;

import com.bucha.dto.pronunciation.PronunciationResponseDto;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.PronunciationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for the pronunciation evaluation pipeline.
 * Uses existing IseService (iFlytek) via SpeechEvaluationService.
 *
 * <pre>
 * POST /api/pronunciation/evaluate   (multipart/form-data, authenticated)
 *   audioFile  – user recording
 *   text       – Chinese reference sentence
 * </pre>
 */
@RestController
@RequestMapping("/api/pronunciation")
public class PronunciationController {

    private static final Logger logger = LoggerFactory.getLogger(PronunciationController.class);

    private final PronunciationService pronunciationService;

    public PronunciationController(PronunciationService pronunciationService) {
        this.pronunciationService = pronunciationService;
    }

    /**
     * Evaluate pronunciation of the uploaded audio against the reference text.
     * Uses SpeechEvaluationService (ISE) then Doubao for feedback. Optional params
     * (lessonId, lineId, etc.) are forwarded to ISE for persistence when provided.
     *
     * @param audioFile     multipart audio file (webm / wav / mp3)
     * @param text          Chinese sentence the user was supposed to read
     * @param principal     current user (required for ISE)
     * @param lessonId      optional — for saving score to lesson stats
     * @param lineId        optional — for saving score per line
     * @param vocabularyId  optional — for vocabulary practice
     * @param source        optional — practice / lesson / test etc.
     * @param includeInDaily optional — include in daily stats
     * @param scoreCategory optional — e.g. hskk, thanh-mau
     * @param testId        optional — for assessment persistence
     * @param questionId    optional — for assessment persistence
     * @return {@link PronunciationResponseDto} with score, feedback, and rawIseData
     */
    @PostMapping(
            value    = "/evaluate",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PronunciationResponseDto> evaluate(
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam("text")      String text,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "lessonId",      required = false) Long lessonId,
            @RequestParam(value = "lineId",       required = false) String lineId,
            @RequestParam(value = "vocabularyId", required = false) String vocabularyId,
            @RequestParam(value = "source",       required = false) String source,
            @RequestParam(value = "includeInDaily", required = false) Boolean includeInDaily,
            @RequestParam(value = "scoreCategory", required = false) String scoreCategory,
            @RequestParam(value = "testId",       required = false) Long testId,
            @RequestParam(value = "questionId",    required = false) Long questionId) {

        logger.info("[PronunciationController] evaluate  text='{}' fileSize={}",
                text, audioFile != null ? audioFile.getSize() : -1);

        PronunciationResponseDto result = pronunciationService.evaluatePronunciation(
                text, audioFile, principal, lessonId, lineId, vocabularyId, source, includeInDaily, scoreCategory, testId, questionId);
        return ResponseEntity.ok(result);
    }
}
