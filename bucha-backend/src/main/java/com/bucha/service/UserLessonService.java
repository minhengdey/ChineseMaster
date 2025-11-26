package com.bucha.service;

import com.bucha.dto.response.LessonCompletionStatusResponse;
import com.bucha.entity.Lesson;
import com.bucha.entity.User;
import com.bucha.entity.UserLesson;
import com.bucha.repository.ConversationLineRepository;
import com.bucha.repository.IseLessonEntryRepository;
import com.bucha.repository.LessonRepository;
import com.bucha.repository.UserLessonRepository;
import com.bucha.repository.VocabularyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserLessonService {
    private final UserService userService;
    private final LessonRepository lessonRepository;
    private final UserLessonRepository userLessonRepository;
    private final IseLessonEntryRepository iseLessonEntryRepository;
    private final ConversationLineRepository conversationLineRepository;
    private final VocabularyRepository vocabularyRepository;
    private final com.bucha.mapper.UserLessonMapper userLessonMapper;

    public UserLessonService(UserService userService,
            LessonRepository lessonRepository,
            UserLessonRepository userLessonRepository,
            IseLessonEntryRepository iseLessonEntryRepository,
            ConversationLineRepository conversationLineRepository,
            VocabularyRepository vocabularyRepository,
            com.bucha.mapper.UserLessonMapper userLessonMapper) {
        this.userService = userService;
        this.lessonRepository = lessonRepository;
        this.userLessonRepository = userLessonRepository;
        this.iseLessonEntryRepository = iseLessonEntryRepository;
        this.conversationLineRepository = conversationLineRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.userLessonMapper = userLessonMapper;
    }

    @Transactional(readOnly = true)
    public UserLesson getOrCreateUserLesson(Long userId, Long lessonId) {
        User u = userService.findById(userId).orElseThrow();
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow();
        return userLessonRepository.findByUser_IdAndLesson_Id(u.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLesson newUl = new UserLesson();
                    newUl.setUser(u);
                    newUl.setLesson(lesson);
                    newUl.setCreatedAt(LocalDateTime.now());
                    newUl.setInProgress(false);
                    newUl.setCompleted(false);
                    return newUl;
                });
    }

    @Transactional(readOnly = true)
    public List<UserLesson> listUserLessons(Long userId) {
        return userLessonRepository.findByUser_Id(userId);
    }

    @Transactional(readOnly = true)
    public com.bucha.dto.response.UserLessonResponse getOrCreateUserLessonResponse(Long userId, Long lessonId) {
        UserLesson ul = getOrCreateUserLesson(userId, lessonId);
        return userLessonMapper.toResponse(ul);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bucha.dto.response.UserLessonResponse> listUserLessonsResponse(Long userId) {
        return listUserLessons(userId).stream().map(userLessonMapper::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LessonCompletionStatusResponse computeCompletionStatus(Long userId, Long lessonId) {
        // Attempts for this lesson
        List<com.bucha.entity.IseLessonEntry> attempts = iseLessonEntryRepository
                .findByUser_IdAndLessonId(userId, lessonId);

        Set<Long> attemptedLineExternalIds = attempts.stream().map(e -> e.getLineId())
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> attemptedVocabExternalIds = attempts.stream().map(e -> e.getVocabularyId())
                .filter(Objects::nonNull).collect(Collectors.toSet());

        List<Long> lessonLineExternalIds = conversationLineRepository.findExternalIdsByLessonId(lessonId);
        List<Long> lessonVocabExternalIds = vocabularyRepository.findExternalIdsByLessonId(lessonId);

        long totalLines = (lessonLineExternalIds == null) ? 0 : lessonLineExternalIds.size();
        long totalVocab = (lessonVocabExternalIds == null) ? 0 : lessonVocabExternalIds.size();

        long userDistinctLineCount = 0;
        if (lessonLineExternalIds != null && !lessonLineExternalIds.isEmpty()) {
            for (Long ext : lessonLineExternalIds) {
                if (attemptedLineExternalIds.contains(ext))
                    userDistinctLineCount++;
            }
        }

        long userDistinctVocabCount = 0;
        if (lessonVocabExternalIds != null && !lessonVocabExternalIds.isEmpty()) {
            for (Long ext : lessonVocabExternalIds) {
                if (attemptedVocabExternalIds.contains(ext))
                    userDistinctVocabCount++;
            }
        }

        boolean linesComplete = (totalLines == 0) || (userDistinctLineCount >= totalLines);
        boolean vocabComplete = (totalVocab == 0) || (userDistinctVocabCount >= totalVocab);
        boolean completed = linesComplete && vocabComplete;

        return LessonCompletionStatusResponse.builder()
                .completed(completed)
                .userDistinctLineCount(userDistinctLineCount)
                .userDistinctVocabCount(userDistinctVocabCount)
                .totalLines(totalLines)
                .totalVocab(totalVocab)
                .build();
    }

    @Transactional
    public LessonCompletionStatusResponse completeLesson(Long userId, Long lessonId, boolean completedFlag) {
        User u = userService.findById(userId).orElseThrow();
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow();
        UserLesson ul = userLessonRepository.findByUser_IdAndLesson_Id(u.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLesson newUl = new UserLesson();
                    newUl.setUser(u);
                    newUl.setLesson(lesson);
                    newUl.setCreatedAt(LocalDateTime.now());
                    newUl.setInProgress(true);
                    newUl.setCompleted(false);
                    return newUl;
                });

        LessonCompletionStatusResponse status = computeCompletionStatus(userId, lessonId);

        if (completedFlag) {
            ul.setCompleted(true);
            ul.setInProgress(false);
            ul.setCompletedAt(LocalDateTime.now());
        } else {
            if (Boolean.TRUE.equals(status.getCompleted())) {
                ul.setCompleted(true);
                ul.setInProgress(false);
                ul.setCompletedAt(LocalDateTime.now());
            } else if ((status.getUserDistinctLineCount() > 0
                    && status.getUserDistinctLineCount() < status.getTotalLines())
                    || (status.getUserDistinctVocabCount() > 0
                            && status.getUserDistinctVocabCount() < status.getTotalVocab())) {
                ul.setInProgress(true);
                ul.setCompleted(false);
            } else {
                ul.setInProgress(false);
                ul.setCompleted(false);
            }
        }
        userLessonRepository.save(ul);
        // Return updated status reflecting persisted completion state if changed
        LessonCompletionStatusResponse finalStatus = LessonCompletionStatusResponse.builder()
                .completed(ul.getCompleted())
                .userDistinctLineCount(status.getUserDistinctLineCount())
                .userDistinctVocabCount(status.getUserDistinctVocabCount())
                .totalLines(status.getTotalLines())
                .totalVocab(status.getTotalVocab())
                .build();
        return finalStatus;
    }
}
