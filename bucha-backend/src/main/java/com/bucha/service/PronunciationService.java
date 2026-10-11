package com.bucha.service;

import com.bucha.client.DoubaoClient;
import com.bucha.dto.pronunciation.PronunciationResponseDto;
import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.bucha.dto.pronunciation.StructuredFeedbackDto;
import com.bucha.exception.PronunciationEvaluationException;
import com.bucha.security.JwtUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Orchestrates the pronunciation evaluation pipeline:
 *
 * <ol>
 *   <li>Send audio to iFlytek ISE via existing {@link IseService} (through {@link SpeechEvaluationService})</li>
 *   <li>Send score + text to Doubao AI → get short feedback</li>
 *   <li>Return combined result to caller</li>
 * </ol>
 *
 * <p>Doubao failure is non-fatal: a built-in default feedback is used instead.</p>
 */
@Service
public class PronunciationService {

    private static final Logger logger = LoggerFactory.getLogger(PronunciationService.class);

    private final SpeechEvaluationService speechEvaluationService;
    private final DoubaoClient doubaoClient;

    public PronunciationService(SpeechEvaluationService speechEvaluationService, DoubaoClient doubaoClient) {
        this.speechEvaluationService = speechEvaluationService;
        this.doubaoClient = doubaoClient;
    }

    /**
     * Evaluate pronunciation of the given recording against the reference text.
     * Uses SpeechEvaluationService (ISE) for scoring, then Doubao for feedback.
     * Optional params are forwarded to ISE for persistence (lesson/line stats).
     *
     * @param referenceText Chinese sentence the user was asked to read
     * @param audioFile     User's recorded audio (webm / wav / mp3)
     * @param principal     Current user (required by ISE)
     * @param lessonId      optional — for persistence
     * @param lineId        optional — for persistence
     * @param vocabularyId  optional — for persistence
     * @param source        optional — for persistence
     * @param includeInDaily optional — for persistence
     * @param scoreCategory optional — for persistence
     * @param testId        optional — for assessment persistence
     * @param questionId    optional — for assessment persistence
     * @param skipDoubaoFeedback when true, skip Doubao API and use built-in feedback only (e.g. placement test)
     * @return evaluation result with score, feedback, rawIseData
     * @throws PronunciationEvaluationException if the recording cannot be evaluated
     * @throws IllegalArgumentException         if inputs are null/empty
     */
    public PronunciationResponseDto evaluatePronunciation(String referenceText, MultipartFile audioFile,
                                                          JwtUserPrincipal principal,
                                                          Long lessonId, String lineId, String vocabularyId,
                                                          String source, Boolean includeInDaily, String scoreCategory,
                                                          Long testId, Long questionId, boolean skipDoubaoFeedback) {
        validateInputs(referenceText, audioFile);

        Map<String, String> optionalForm = buildOptionalForm(lessonId, lineId, vocabularyId, source, includeInDaily, scoreCategory, testId, questionId);

        // Step 1 ─ Full ISE evaluation → SpeechEvaluationResult with all sub-scores
        SpeechEvaluationResult evalResult;
        try {
            logger.info("[PronunciationService] Evaluating: text='{}' audioSize={}",
                    referenceText, audioFile.getSize());
            evalResult = speechEvaluationService.evaluate(referenceText, audioFile, principal, optionalForm);
            logger.info("[PronunciationService] ISE result: {}", evalResult);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (IllegalStateException e) {
            throw new PronunciationEvaluationException(e.getMessage(), e);
        } catch (Exception e) {
            logger.error("[PronunciationService] Unexpected ISE error", e);
            throw new PronunciationEvaluationException(
                    "Pronunciation evaluation failed. Please try again.", e);
        }

        // Step 2 ─ Structured AI feedback via Doubao (HSKK judge style); skipped for assessment test flow
        StructuredFeedbackDto structured;
        if (skipDoubaoFeedback) {
            structured = DoubaoClient.defaultStructuredFeedback(evalResult.getTotalScore(), evalResult.isRejected());
        } else {
            try {
                structured = doubaoClient.generateStructuredFeedback(evalResult);
                logger.debug("[PronunciationService] Doubao structured feedback: {}", structured.getOverallFeedback());
            } catch (Exception e) {
                logger.warn("[PronunciationService] Doubao call threw unexpectedly: {}", e.getMessage());
                structured = DoubaoClient.defaultStructuredFeedback(evalResult.getTotalScore(), evalResult.isRejected());
            }
        }
        String feedbackText = structured.getOverallFeedback() != null ? structured.getOverallFeedback() : DoubaoClient.defaultFeedback(evalResult.getTotalScore(), evalResult.isRejected());

        // Step 3 ─ Build response with all sub-scores, raw ISE data, and structured feedback
        return PronunciationResponseDto.builder()
                .score(evalResult.getTotalScore())
                .feedback(feedbackText)
                .fluency(evalResult.getFluencyScore() > 0 ? evalResult.getFluencyScore() : null)
                .completeness(evalResult.getCompletenessScore() > 0 ? evalResult.getCompletenessScore() : null)
                .rawIseData(evalResult.getRawIseData())
                .overallFeedback(structured.getOverallFeedback())
                .pronunciationIssue(structured.getPronunciationIssue())
                .toneIssue(structured.getToneIssue())
                .fluencyIssue(structured.getFluencyIssue())
                .improvementTip(structured.getImprovementTip())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────

    private static void validateInputs(String text, MultipartFile file) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Reference text must not be empty.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file must not be empty.");
        }
        long maxBytes = 20 * 1024 * 1024; // 20 MB guard
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Audio file exceeds the 20 MB size limit.");
        }
    }

    private static Map<String, String> buildOptionalForm(Long lessonId, String lineId, String vocabularyId,
                                                         String source, Boolean includeInDaily, String scoreCategory,
                                                         Long testId, Long questionId) {
        Map<String, String> m = new HashMap<>();
        if (lessonId != null)        m.put("lessonId", String.valueOf(lessonId));
        if (lineId != null)          m.put("lineId", lineId);
        if (vocabularyId != null)    m.put("vocabularyId", vocabularyId);
        if (source != null)          m.put("source", source);
        if (includeInDaily != null)  m.put("includeInDaily", String.valueOf(includeInDaily));
        if (scoreCategory != null)   m.put("scoreCategory", scoreCategory);
        if (testId != null)          m.put("testId", String.valueOf(testId));
        if (questionId != null)      m.put("questionId", String.valueOf(questionId));
        return m.isEmpty() ? null : m;
    }
}
