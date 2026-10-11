package com.bucha.service;

import com.bucha.client.DoubaoClient;
import com.bucha.client.IflytekApiException;
import com.bucha.client.IflytekIatService;
import com.bucha.dto.hskk.Part2DoubaoResult;
import com.bucha.dto.hskk.Part2Response;
import com.bucha.dto.hskk.Part3Response;
import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.bucha.security.JwtUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Orchestrates HSKK Part 2 and Part 3 evaluation.
 * Part 2: IAT → Doubao.
 * Part 3: IAT → pronunciation scoring (ISE) → Doubao (with scores).
 */
@Service
public class SpeakingEvaluationService {

    private static final Logger logger = LoggerFactory.getLogger(SpeakingEvaluationService.class);

    private final IflytekIatService iflytekIatService;
    private final DoubaoClient doubaoClient;
    private final SpeechEvaluationService speechEvaluationService;

    public SpeakingEvaluationService(IflytekIatService iflytekIatService,
                                    DoubaoClient doubaoClient,
                                    SpeechEvaluationService speechEvaluationService) {
        this.iflytekIatService = iflytekIatService;
        this.doubaoClient = doubaoClient;
        this.speechEvaluationService = speechEvaluationService;
    }

    /**
     * Evaluate Part 2 answer: speech-to-text then AI evaluation.
     *
     * @param questionText Part 2 question text (user heard and is answering)
     * @param audioFile    user's recorded answer
     * @return transcript + content/fluency/pronunciation/sample from Doubao
     * @throws IflytekApiException if IAT fails or transcript is empty (e.g. "Không nhận diện được giọng nói, vui lòng thử lại.")
     */
    public Part2Response evaluatePart2(String questionText, MultipartFile audioFile) {
        // 1. Audio → transcript via iFlytek IAT
        String transcript = iflytekIatService.speechToText(audioFile);

        if (transcript == null || transcript.isBlank()) {
            throw new IflytekApiException("Không nhận diện được giọng nói, vui lòng thử lại.");
        }

        logger.info("[SpeakingEvaluationService] Part2 transcript (for debug): {}", transcript);

        // 2. Build prompt and call Doubao
        Part2DoubaoResult doubao = doubaoClient.evaluatePart2(
                questionText != null ? questionText : "",
                transcript);

        // 3. Map to API response (camelCase)
        return Part2Response.builder()
                .transcript(transcript)
                .contentScore(doubao.getContent_score())
                .contentEvaluation(doubao.getContent_evaluation())
                .fluencyComment(doubao.getFluency_comment())
                .pronunciationComment(doubao.getPronunciation_comment())
                .improvementTip(doubao.getImprovement_tip())
                .sampleAnswer(doubao.getSample_answer())
                .build();
    }

    /**
     * Evaluate Part 3 answer: IAT → pronunciation scoring (ISE, reference = transcript) → Doubao.
     *
     * @param questionText Part 3 question text
     * @param audioFile    user's recorded answer (up to 1.5 min)
     * @param principal    current user (optional; used for ISE scoring endpoint)
     * @return transcript + totalScore, pronunciationScore, toneScore, fluencyScore + Doubao feedback
     * @throws IflytekApiException if IAT fails or transcript is empty
     */
    public Part3Response evaluatePart3(String questionText, MultipartFile audioFile, JwtUserPrincipal principal) {
        // 1. Audio → transcript via iFlytek IAT
        String transcript = iflytekIatService.speechToText(audioFile);
        if (transcript == null || transcript.isBlank()) {
            throw new IflytekApiException("Không nhận diện được giọng nói, vui lòng thử lại.");
        }
        logger.info("[SpeakingEvaluationService] Part3 transcript (for debug): {}", transcript);

        // 2. Pronunciation scoring: ISE with reference text = transcript (score how well user pronounced what they said)
        SpeechEvaluationResult scoreResult;
        try {
            scoreResult = speechEvaluationService.evaluate(transcript, audioFile, principal);
        } catch (Exception e) {
            logger.warn("[SpeakingEvaluationService] Part3 ISE scoring failed: {}", e.getMessage());
            scoreResult = new SpeechEvaluationResult();
            scoreResult.setTotalScore(0.0);
            scoreResult.setPhoneScore(0.0);
            scoreResult.setToneScore(0.0);
            scoreResult.setFluencyScore(0.0);
        }

        double pronunciationScore = scoreResult.getPhoneScore();
        double fluencyScore = scoreResult.getFluencyScore();

        // 3. Build prompt and call Doubao (content + fluency/pronunciation comments + 5–6 sentence sample)
        Part2DoubaoResult doubao = doubaoClient.evaluatePart3(
                questionText != null ? questionText : "",
                transcript,
                pronunciationScore,
                fluencyScore);

        // 4. Merge into Part3Response
        return Part3Response.builder()
                .transcript(transcript)
                .totalScore(scoreResult.getTotalScore())
                .pronunciationScore(pronunciationScore)
                .toneScore(scoreResult.getToneScore())
                .fluencyScore(fluencyScore)
                .contentEvaluation(doubao.getContent_evaluation())
                .fluencyComment(doubao.getFluency_comment())
                .pronunciationComment(doubao.getPronunciation_comment())
                .improvementTip(doubao.getImprovement_tip())
                .sampleAnswer(doubao.getSample_answer())
                .build();
    }
}
