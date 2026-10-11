package com.bucha.service;

import com.bucha.client.DoubaoClient;
import com.bucha.dto.hskk.*;
import com.bucha.dto.pronunciation.SpeechEvaluationResult;
import com.bucha.dto.pronunciation.StructuredFeedbackDto;
import com.bucha.entity.HSKKAnswer;
import com.bucha.entity.HSKKExamResult;
import com.bucha.entity.HSKKQuestion;
import com.bucha.entity.UserEntity;
import com.bucha.repository.HSKKAnswerRepository;
import com.bucha.repository.HSKKExamResultRepository;
import com.bucha.repository.HSKKQuestionRepository;
import com.bucha.repository.UserRepository;
import com.bucha.security.JwtUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * HSKK Basic exam: questions, submit answer (evaluate + AI feedback), finish exam, history.
 */
@Service
@RequiredArgsConstructor
public class HSKKService {

    private static final double PART1_WEIGHT = 2.0;   // score per question = pronunciationScore * 2, 15 questions -> 30 max per q -> total 30
    private static final double PART2_WEIGHT = 4.0;   // 10 questions, 40 total
    private static final double PART3_WEIGHT = 15.0;  // 2 questions, 30 total

    private final HSKKQuestionRepository questionRepository;
    private final HSKKExamResultRepository examResultRepository;
    private final HSKKAnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final SpeechEvaluationService speechEvaluationService;
    private final DoubaoClient doubaoClient;

    public HSKKQuestionsByPartDto getQuestions() {
        List<HSKKQuestion> all = questionRepository.findAllByOrderByPartAscQuestionOrderAsc();
        Map<Integer, List<HSKKQuestion>> byPart = all.stream().collect(Collectors.groupingBy(HSKKQuestion::getPart));
        return HSKKQuestionsByPartDto.builder()
                .part1(toDtos(byPart.getOrDefault(1, List.of())))
                .part2(toDtos(byPart.getOrDefault(2, List.of())))
                .part3(toDtos(byPart.getOrDefault(3, List.of())))
                .build();
    }

    private static List<HSKKQuestionDto> toDtos(List<HSKKQuestion> list) {
        return list.stream().map(q -> HSKKQuestionDto.builder()
                .id(q.getId())
                .text(q.getText())
                .part(q.getPart())
                .questionOrder(q.getQuestionOrder())
                .audioUrl(q.getAudioUrl())
                .build()).collect(Collectors.toList());
    }

    /**
     * Start a new exam (create an in-progress exam result). Frontend can call this when user clicks "Start exam".
     */
    @Transactional
    public HSKKExamResultDto startExam(JwtUserPrincipal principal) {
        UserEntity user = userRepository.findById(principal.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        HSKKExamResult exam = HSKKExamResult.builder()
                .user(user)
                .totalScore(0.0)
                .part1Score(0.0)
                .part2Score(0.0)
                .part3Score(0.0)
                .build();
        exam = examResultRepository.save(exam);
        return toResultDto(exam);
    }

    /**
     * Submit one answer: evaluate audio via iFlytek, get AI feedback from Doubao, save HSKKAnswer.
     */
    @Transactional
    public SubmitHSKKAnswerResponse submitAnswer(JwtUserPrincipal principal, Long examResultId, Long questionId,
                                                 String referenceText, MultipartFile audioFile) {
        HSKKExamResult exam = examResultRepository.findById(examResultId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found"));
        if (!exam.getUser().getId().equals(principal.id())) {
            throw new IllegalArgumentException("Exam does not belong to current user");
        }
        HSKKQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        String refText = referenceText != null && !referenceText.isBlank()
                ? referenceText
                : question.getText();

        // Evaluate via ISE — get full sub-scores
        SpeechEvaluationResult evalResult = speechEvaluationService.evaluate(refText, audioFile, principal);
        double pronunciationScore = evalResult.getTotalScore();

        // Structured feedback (HSKK judge style) via Doubao
        StructuredFeedbackDto structured;
        try {
            structured = doubaoClient.generateStructuredFeedback(evalResult);
        } catch (Exception e) {
            structured = DoubaoClient.defaultStructuredFeedback(pronunciationScore, evalResult.isRejected());
        }
        String aiFeedback = structured.getOverallFeedback() != null ? structured.getOverallFeedback() : DoubaoClient.defaultFeedback(pronunciationScore, evalResult.isRejected());

        HSKKAnswer answer = HSKKAnswer.builder()
                .examResult(exam)
                .question(question)
                .pronunciationScore(pronunciationScore)
                .aiFeedback(aiFeedback)
                .build();
        answer = answerRepository.save(answer);

        return SubmitHSKKAnswerResponse.builder()
                .pronunciationScore(pronunciationScore)
                .aiFeedback(aiFeedback)
                .answerId(answer.getId())
                .iseResult(evalResult.getRawIseData())
                .overallFeedback(structured.getOverallFeedback())
                .pronunciationIssue(structured.getPronunciationIssue())
                .toneIssue(structured.getToneIssue())
                .fluencyIssue(structured.getFluencyIssue())
                .improvementTip(structured.getImprovementTip())
                .build();
    }

    /**
     * Finish exam: compute part scores and total from all answers, update exam result.
     */
    @Transactional
    public HSKKExamResultDto finishExam(JwtUserPrincipal principal, Long examResultId) {
        HSKKExamResult exam = examResultRepository.findById(examResultId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found"));
        if (!exam.getUser().getId().equals(principal.id())) {
            throw new IllegalArgumentException("Exam does not belong to current user");
        }
        List<HSKKAnswer> answers = answerRepository.findByExamResultId(exam.getId());
        double part1 = 0.0, part2 = 0.0, part3 = 0.0;
        for (HSKKAnswer a : answers) {
            double norm = Math.max(0, Math.min(100, a.getPronunciationScore() != null ? a.getPronunciationScore() : 0));
            int part = a.getQuestion().getPart();
            if (part == 1) part1 += (norm / 100.0) * PART1_WEIGHT;
            else if (part == 2) part2 += (norm / 100.0) * PART2_WEIGHT;
            else if (part == 3) part3 += (norm / 100.0) * PART3_WEIGHT;
        }
        // Part totals: Part1 max 30 (15*2), Part2 max 40 (10*4), Part3 max 30 (2*15)
        double total = part1 + part2 + part3;
        exam.setPart1Score(part1);
        exam.setPart2Score(part2);
        exam.setPart3Score(part3);
        exam.setTotalScore(total);
        examResultRepository.save(exam);
        return toResultDto(exam);
    }

    public List<HSKKExamResultDto> getHistory(JwtUserPrincipal principal, int limit) {
        List<HSKKExamResult> list = examResultRepository.findByUser_IdOrderByCreatedAtDesc(
                principal.id(), PageRequest.of(0, limit));
        return list.stream().map(this::toResultDto).collect(Collectors.toList());
    }

    private HSKKExamResultDto toResultDto(HSKKExamResult e) {
        return HSKKExamResultDto.builder()
                .id(e.getId())
                .totalScore(e.getTotalScore())
                .part1Score(e.getPart1Score())
                .part2Score(e.getPart2Score())
                .part3Score(e.getPart3Score())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
