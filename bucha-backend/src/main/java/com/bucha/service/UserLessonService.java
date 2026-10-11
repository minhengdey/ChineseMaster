package com.bucha.service;

import com.bucha.dto.userlesson.LessonCompletionDto;
import com.bucha.dto.userlesson.UserLessonDto;
import com.bucha.entity.IseLessonEntry;
import com.bucha.entity.Lesson;
import com.bucha.entity.UserEntity;
import com.bucha.entity.UserLesson;
import com.bucha.mapper.UserLessonMapper;
import com.bucha.repository.ConversationLineRepository;
import com.bucha.repository.IseLessonEntryRepository;
import com.bucha.repository.LessonRepository;
import com.bucha.repository.UserLessonRepository;
import com.bucha.repository.VocabularyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserLessonService {

    private final UserService userService;
    private final LessonRepository lessonRepository;
    private final UserLessonRepository userLessonRepository;
    private final IseLessonEntryRepository iseLessonEntryRepository;
    private final ConversationLineRepository conversationLineRepository;
    private final VocabularyRepository vocabularyRepository;
    private final UserLessonMapper userLessonMapper;

    /**
     * Get or create UserLesson for user and lesson. Returns DTO (conversion via mapper).
     */
    public UserLessonDto getOrCreateUserLesson(Long userId, Long lessonId) {
        UserEntity user = userService.findById(userId).orElseThrow();
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow();
        UserLesson ul = userLessonRepository.findByUser_IdAndLesson_Id(user.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLesson newUl = new UserLesson();
                    newUl.setUser(user);
                    newUl.setLesson(lesson);
                    newUl.setCreatedAt(LocalDateTime.now());
                    newUl.setInProgress(false);
                    newUl.setCompleted(false);
                    return newUl;
                });
        return userLessonMapper.toDto(ul);
    }

    /**
     * Batch completion for multiple lessons. lessonIdsParam: comma-separated IDs. Returns map lessonId -> LessonCompletionDto.
     */
    public Map<String, LessonCompletionDto> getCompletionBatch(Long userId, String lessonIdsParam) {
        List<Long> lessonIds = parseLessonIds(lessonIdsParam);
        Map<String, LessonCompletionDto> result = new HashMap<>();
        if (lessonIds.isEmpty()) {
            return result;
        }
        UserEntity user = userService.findById(userId).orElseThrow();
        for (Long lessonId : lessonIds) {
            try {
                result.put(String.valueOf(lessonId), computeCompletion(user.getId(), lessonId));
            } catch (Exception e) {
                log.debug("Completion for lesson {} failed: {}", lessonId, e.getMessage());
                result.put(String.valueOf(lessonId), LessonCompletionDto.builder()
                        .completed(false)
                        .userDistinctLineCount(0L)
                        .userDistinctVocabCount(0L)
                        .totalLines(0L)
                        .totalVocab(0L)
                        .build());
            }
        }
        return result;
    }

    /**
     * Completion status for a single lesson.
     */
    public LessonCompletionDto computeCompletion(long userId, long lessonId) {
        List<IseLessonEntry> attempts = iseLessonEntryRepository.findByUser_IdAndLessonId(userId, lessonId);
        Set<Long> attemptedLineExternalIds = attempts.stream()
                .map(IseLessonEntry::getLineId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> attemptedVocabExternalIds = attempts.stream()
                .map(IseLessonEntry::getVocabularyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Long> lessonLineExternalIds = conversationLineRepository.findExternalIdsByLessonId(lessonId);
        List<Long> lessonVocabExternalIds = vocabularyRepository.findExternalIdsByLessonId(lessonId);
        long totalLines = (lessonLineExternalIds == null) ? 0 : lessonLineExternalIds.size();
        long totalVocab = (lessonVocabExternalIds == null) ? 0 : lessonVocabExternalIds.size();

        long userDistinctLineCount = 0;
        if (lessonLineExternalIds != null && !lessonLineExternalIds.isEmpty()) {
            for (Long ext : lessonLineExternalIds) {
                if (attemptedLineExternalIds.contains(ext)) userDistinctLineCount++;
            }
        }
        long userDistinctVocabCount = 0;
        if (lessonVocabExternalIds != null && !lessonVocabExternalIds.isEmpty()) {
            for (Long ext : lessonVocabExternalIds) {
                if (attemptedVocabExternalIds.contains(ext)) userDistinctVocabCount++;
            }
        }

        boolean linesComplete = (totalLines == 0) || (userDistinctLineCount >= totalLines);
        boolean vocabComplete = (totalVocab == 0) || (userDistinctVocabCount >= totalVocab);
        boolean completed = linesComplete && vocabComplete;

        return LessonCompletionDto.builder()
                .completed(completed)
                .userDistinctLineCount(userDistinctLineCount)
                .userDistinctVocabCount(userDistinctVocabCount)
                .totalLines(totalLines)
                .totalVocab(totalVocab)
                .build();
    }

    /**
     * Mark lesson complete/incomplete and update UserLesson state based on actual completion.
     */
    @Transactional
    public Map<String, Object> completeLesson(Long userId, Long lessonId, boolean completedParam) {
        UserEntity user = userService.findById(userId).orElseThrow();
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow();

        UserLesson ul = userLessonRepository.findByUser_IdAndLesson_Id(user.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLesson newUl = new UserLesson();
                    newUl.setUser(user);
                    newUl.setLesson(lesson);
                    newUl.setCreatedAt(LocalDateTime.now());
                    newUl.setInProgress(true);
                    newUl.setCompleted(false);
                    return newUl;
                });

        List<IseLessonEntry> attempts = iseLessonEntryRepository.findByUser_IdAndLessonId(user.getId(), lessonId);
        Set<Long> attemptedLineExternalIds = attempts.stream()
                .map(IseLessonEntry::getLineId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> attemptedVocabExternalIds = attempts.stream()
                .map(IseLessonEntry::getVocabularyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Long> lessonLineExternalIds = conversationLineRepository.findExternalIdsByLessonId(lessonId);
        List<Long> lessonVocabExternalIds = vocabularyRepository.findExternalIdsByLessonId(lessonId);
        long totalLines = (lessonLineExternalIds == null) ? 0 : lessonLineExternalIds.size();
        long totalVocab = (lessonVocabExternalIds == null) ? 0 : lessonVocabExternalIds.size();

        long userDistinctLineCount = 0;
        if (lessonLineExternalIds != null && !lessonLineExternalIds.isEmpty()) {
            for (Long ext : lessonLineExternalIds) {
                if (attemptedLineExternalIds.contains(ext)) userDistinctLineCount++;
            }
        }
        long userDistinctVocabCount = 0;
        if (lessonVocabExternalIds != null && !lessonVocabExternalIds.isEmpty()) {
            for (Long ext : lessonVocabExternalIds) {
                if (attemptedVocabExternalIds.contains(ext)) userDistinctVocabCount++;
            }
        }

        boolean linesComplete = (totalLines == 0) || (userDistinctLineCount >= totalLines);
        boolean vocabComplete = (totalVocab == 0) || (userDistinctVocabCount >= totalVocab);

        if (completedParam) {
            ul.setCompleted(true);
            ul.setInProgress(false);
            ul.setCompletedAt(LocalDateTime.now());
        } else {
            if (linesComplete && vocabComplete) {
                ul.setCompleted(true);
                ul.setInProgress(false);
                ul.setCompletedAt(LocalDateTime.now());
            } else if ((userDistinctLineCount > 0 && userDistinctLineCount < totalLines)
                    || (userDistinctVocabCount > 0 && userDistinctVocabCount < totalVocab)) {
                ul.setInProgress(true);
                ul.setCompleted(false);
            } else {
                ul.setInProgress(false);
                ul.setCompleted(false);
            }
        }
        userLessonRepository.save(ul);
        log.debug("UserLesson updated: {}", ul);

        return Map.of(
                "status", "ok",
                "completed", ul.isCompleted(),
                "userDistinctLineCount", userDistinctLineCount,
                "userDistinctVocabCount", userDistinctVocabCount,
                "totalLines", totalLines,
                "totalVocab", totalVocab);
    }

    private static List<Long> parseLessonIds(String lessonIdsParam) {
        if (lessonIdsParam == null || lessonIdsParam.isBlank()) {
            return List.of();
        }
        return Arrays.stream(lessonIdsParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return Long.parseLong(s);
                    } catch (NumberFormatException e) {
                        return (Long) null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
