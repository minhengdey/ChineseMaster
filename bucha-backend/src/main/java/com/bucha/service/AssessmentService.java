package com.bucha.service;

import com.bucha.dto.assessment.*;
import com.bucha.entity.Exam;
import com.bucha.entity.Question;
import com.bucha.entity.QuestionType;
import com.bucha.entity.UserExamResult;
import com.bucha.entity.UserEntity;
import com.bucha.exception.ExamNotFoundException;
import com.bucha.mapper.AssessmentMapper;
import com.bucha.mapper.QuestionMapper;
import com.bucha.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssessmentService {

    ExamRepository examRepository;

    UserExamResultRepository userExamResultRepository;
    UserRepository userRepository;
    VocabularyRepository vocabularyRepository;
    CloudinaryService cloudinaryService;
    IseTestEntryRepository iseTestEntryRepository;

    AssessmentMapper assessmentMapper;
    ObjectMapper objectMapper;
    QuestionRepository questionRepository;
    QuestionMapper questionMapper;

    /**
     * Get all active exams for the current user
     */
    public List<ExamSummaryDTO> getAllExams(Long userId) {
        List<Exam> exams = examRepository.findAllByOrderAsc();

        // If user is not authenticated, return exams without completion info
        Map<Long, UserExamResult> latestResults;
        if (userId != null) {
            latestResults = userExamResultRepository
                    .findAllByUserId(userId)
                    .stream()
                    .collect(Collectors.toMap(
                            result -> result.getExam().getExternalId(),
                            result -> result,
                            (existing, replacement) -> existing.getCompletedAt().isAfter(replacement.getCompletedAt())
                                    ? existing
                                    : replacement));
        } else {
            latestResults = Collections.emptyMap();
        }

        return exams.stream()
                .map(exam -> {
                    ExamSummaryDTO dto = assessmentMapper.toExamSummaryDTO(exam);
                    UserExamResult result = latestResults.get(exam.getExternalId());
                    if (result != null) {
                        dto.setCompleted(true);
                        dto.setScore(result.getTotalScore());
                    } else {
                        dto.setCompleted(false);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get exam detail with test data
     */
    @Transactional
    public ExamDetailDTO getExamById(String examExternalId, Long userId) {
        Long externalIdLong = parseExternalId(examExternalId);
        Exam exam = examRepository.findByExternalIdWithQuestions(externalIdLong)
                .orElseThrow(() -> new ExamNotFoundException(externalIdLong));

        ExamDetailDTO dto = assessmentMapper.toExamDetailDTO(exam);

        // Check if user completed this exam
        Optional<UserExamResult> latestResult = Optional.empty();
        if (userId != null) {
            latestResult = userExamResultRepository
                    .findLatestByUserIdAndExamExternalId(userId, externalIdLong);
        }

        if (latestResult.isPresent()) {
            UserExamResult result = latestResult.get();
            dto.setCompleted(true);
            dto.setScore(result.getTotalScore());

            // Parse last result from JSON
            try {
                if (result.getDetailsJson() != null) {
                    LastResultDTO lastResult = parseLastResult(result);
                    dto.setLastResult(lastResult);
                }
            } catch (Exception e) {
                log.error("Error parsing exam result details", e);
            }
        } else {
            dto.setCompleted(false);
        }

        // Build test data
        ExamTestDataDTO testData = buildTestData(exam);
        dto.setTestData(testData);

        return dto;
    }

    /**
     * Start assessment - clear old test entries for fresh start
     */
    @Transactional
    public void startAssessment(String examExternalId, Long userId) {
        Long externalIdLong = parseExternalId(examExternalId);
        Exam exam = examRepository.findByExternalId(externalIdLong)
                .orElseThrow(() -> new ExamNotFoundException(externalIdLong));

        // Clear old test entries for this user and exam
        if (userId != null) {
            int deleted = iseTestEntryRepository.deleteByTestIdAndUserId(externalIdLong, userId);
            if (deleted > 0) {
                log.info("Cleared {} old test entries for user {} and exam {} when starting assessment",
                        deleted, userId, externalIdLong);
            }
        }
    }

    /**
     * Submit exam results
     * Note: Per-item scores are automatically saved in IseService during scoring.
     * This endpoint is for final exam summary only.
     */
    @Transactional
    public void submitExamResult(Long userId, SubmitExamRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long assessmentExternalId = parseExternalId(request.getAssessmentId());
        Exam exam = examRepository.findByExternalId(assessmentExternalId)
                .orElseThrow(() -> new ExamNotFoundException(assessmentExternalId));

        // Only handle final exam submission (has sections and totalScore)
        // Per-item submissions are handled automatically in IseService
        if (request.getSections() != null && request.getTotalScore() != null) {
            handleFinalExamSubmission(user, exam, request);
        }
    }

    @Transactional
    protected void handleFinalExamSubmission(UserEntity user, Exam exam, SubmitExamRequest request) {
        // Kiểm tra xem đã có kết quả cho bài thi này chưa (trong vòng 5 phút gần đây để
        // tránh duplicate)
        Optional<UserExamResult> recentResult = userExamResultRepository.findLatestByUserIdAndExamId(
                user.getId(), exam.getId());

        if (recentResult.isPresent()) {
            UserExamResult latest = recentResult.get();
            // Tránh double-submit mạng; cho phép làm lại bài (start đã xóa ise entries) vẫn ghi đè kết quả.
            if (latest.getCompletedAt().isAfter(java.time.LocalDateTime.now().minusMinutes(5))) {
                log.info("Replacing recent exam result for user {} exam {} (was {}) with new submission",
                        user.getId(), exam.getExternalId(), latest.getCompletedAt());
                userExamResultRepository.delete(latest);
            }
        }

        // Calculate section scores
        Double initialScore = request.getSections().get("thanh-mau") != null
                ? request.getSections().get("thanh-mau").getAverageScore()
                : null;
        Double finalScore = request.getSections().get("van-mau") != null
                ? request.getSections().get("van-mau").getAverageScore()
                : null;
        Double toneScore = request.getSections().get("thanh-dieu") != null
                ? request.getSections().get("thanh-dieu").getAverageScore()
                : null;
        Double sentenceScore = request.getSections().get("cau") != null
                ? request.getSections().get("cau").getAverageScore()
                : null;

        // Serialize details to JSON
        String detailsJson;
        try {
            detailsJson = objectMapper.writeValueAsString(request.getSections());
        } catch (Exception e) {
            log.error("Error serializing exam details", e);
            detailsJson = "{}";
        }

        UserExamResult result = UserExamResult.builder()
                .user(user)
                .exam(exam)
                .totalScore(request.getTotalScore())
                .initialScore(initialScore)
                .finalScore(finalScore)
                .toneScore(toneScore)
                .sentenceScore(sentenceScore)
                .detailsJson(detailsJson)
                .durationSeconds(request.getDurationSeconds())
                .build();

        userExamResultRepository.save(result);
        log.info("Saved exam result for user {} on exam externalId {}, score: {}",
                user.getId(), exam.getExternalId(), request.getTotalScore());
    }

    private Long parseExternalId(String externalId) {
        try {
            return Long.parseLong(externalId);
        } catch (NumberFormatException e) {
            throw new ExamNotFoundException(externalId);
        }
    }

    /**
     * Build test data grouped by question type
     */
    private ExamTestDataDTO buildTestData(Exam exam) {
        ExamTestDataDTO testData = new ExamTestDataDTO();

        // Map INITIAL to thanhMau
        List<QuestionDTO> thanhMau = questionRepository
                .findByExamExternalIdAndType(exam.getExternalId(), QuestionType.INITIAL)
                .stream().map(questionMapper::toDto).peek(dto -> {
                    if (dto.getAudioPublicId() != null) {
                        dto.setAudioUrl(cloudinaryService.getAudioUrl(dto.getAudioPublicId()));
                    }
                }).toList();
        testData.setThanhMau(thanhMau);

        // Map FINAL to vanMau
        List<QuestionDTO> vanMau = questionRepository
                .findByExamExternalIdAndType(exam.getExternalId(), QuestionType.FINAL)
                .stream().map(questionMapper::toDto).peek(dto -> {
                    if (dto.getAudioPublicId() != null) {
                        dto.setAudioUrl(cloudinaryService.getAudioUrl(dto.getAudioPublicId()));
                    }
                }).toList();
        testData.setVanMau(vanMau);

        // Map TONE to thanhDieu
        List<QuestionDTO> thanhDieu = questionRepository
                .findByExamExternalIdAndType(exam.getExternalId(), QuestionType.TONE)
                .stream().map(questionMapper::toDto).peek(dto -> {
                    if (dto.getAudioPublicId() != null) {
                        dto.setAudioUrl(cloudinaryService.getAudioUrl(dto.getAudioPublicId()));
                    }
                }).toList();
        testData.setThanhDieu(thanhDieu);

        // Map SENTENCE to sentences
        List<QuestionDTO> sentences = questionRepository
                .findByExamExternalIdAndType(exam.getExternalId(), QuestionType.SENTENCE)
                .stream().map(questionMapper::toDto).peek(dto -> {
                    if (dto.getAudioPublicId() != null) {
                        dto.setAudioUrl(cloudinaryService.getAudioUrl(dto.getAudioPublicId()));
                    }
                }).toList();
        testData.setSentences(sentences);

        return testData;
    }

    /**
     * Parse last result from UserExamResult
     */
    private LastResultDTO parseLastResult(UserExamResult result) {
        try {
            Map<String, SectionResultDTO> sections = objectMapper.readValue(
                    result.getDetailsJson(),
                    objectMapper.getTypeFactory().constructMapType(
                            HashMap.class,
                            String.class,
                            SectionResultDTO.class));

            return LastResultDTO.builder()
                    .sections(sections)
                    .totalScore(result.getTotalScore())
                    .build();
        } catch (Exception e) {
            log.error("Error parsing last result", e);
            return null;
        }
    }

    /**
     * Get test results from ise_test_entry for an assessment
     */
    public Map<String, Object> getTestResults(String assessmentId, Long userId) {
        Long testId = parseExternalId(assessmentId);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all test entries for this test and user
        List<com.bucha.entity.IseTestEntry> entries = iseTestEntryRepository
                .findByTestIdAndUser(testId, user);

        // Group by question ID
        Map<Long, Map<String, Object>> questionResults = new HashMap<>();

        for (com.bucha.entity.IseTestEntry entry : entries) {
            Long questionId = entry.getQuestionId();
            if (questionId == null)
                continue;

            Map<String, Object> questionData = questionResults.computeIfAbsent(questionId,
                    k -> new HashMap<>());

            questionData.put("questionId", questionId);
            questionData.put("totalScore", entry.getTotalScore());

            if (entry.getInitialScore() != null) {
                questionData.put("initialScore", entry.getInitialScore());
            }
            if (entry.getFinalScore() != null) {
                questionData.put("finalScore", entry.getFinalScore());
            }
            if (entry.getToneScore() != null) {
                questionData.put("toneScore", entry.getToneScore());
            }
        }

        // Calculate section averages
        Map<String, Double> sectionScores = new HashMap<>();
        double totalSum = 0.0;
        int totalCount = 0;

        for (Map<String, Object> questionData : questionResults.values()) {
            if (questionData.containsKey("totalScore")) {
                totalSum += (Double) questionData.get("totalScore");
                totalCount++;
            }
        }

        double overallAverage = totalCount > 0 ? totalSum / totalCount : 0.0;

        Map<String, Object> response = new HashMap<>();
        response.put("questions", new ArrayList<>(questionResults.values()));
        response.put("overallAverage", overallAverage);
        response.put("totalQuestions", totalCount);

        return response;
    }
}
