package com.bucha.controller;

import com.bucha.entity.Lesson;
import com.bucha.entity.UserEntity;
import com.bucha.entity.UserLesson;
import com.bucha.repository.ConversationLineRepository;
import com.bucha.repository.IseLessonEntryRepository;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.UserService;
import com.bucha.repository.LessonRepository;
import com.bucha.repository.UserLessonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/user-lessons")
public class UserLessonController {
    private final UserService userService;
    private final LessonRepository lessonRepository;
    private final UserLessonRepository userLessonRepository;
    private final IseLessonEntryRepository iseLessonEntryRepository;
    private final ConversationLineRepository conversationLineRepository;
    private final com.bucha.repository.VocabularyRepository vocabularyRepository;

    public UserLessonController(UserService userService, LessonRepository lessonRepository,
            UserLessonRepository userLessonRepository, IseLessonEntryRepository iseLessonEntryRepository,
            ConversationLineRepository conversationLineRepository,
            com.bucha.repository.VocabularyRepository vocabularyRepository) {
        this.userService = userService;
        this.lessonRepository = lessonRepository;
        this.userLessonRepository = userLessonRepository;
        this.iseLessonEntryRepository = iseLessonEntryRepository;
        this.conversationLineRepository = conversationLineRepository;
        this.vocabularyRepository = vocabularyRepository;
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<?> getUserLessons(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId) {
        UserEntity u = userService.findById(principal.id()).orElseThrow();
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow();

        UserLesson ul = userLessonRepository.findByUser_IdAndLesson_Id(u.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLesson newUl = new UserLesson();
                    newUl.setUser(u);
                    newUl.setLesson(lesson);
                    newUl.setCreatedAt(LocalDateTime.now());
                    newUl.setInProgress(false);
                    newUl.setCompleted(false);
                    return newUl;
                });

        return ResponseEntity.ok(ul);
    }

    @GetMapping("/{lessonId}/isCompleted")
    public ResponseEntity<?> isLessonCompleted(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId) {
        UserEntity u = userService.findById(principal.id()).orElseThrow();
        // Count distinct attempted external IDs (line/vocab) for this lesson. The
        // ISE entries store external IDs (from conversation_lines.externalId and
        // vocabularies.externalId). We'll compare those to the lists of external
        // IDs defined for the lesson so completion is based on finishing all
        // external items.
        java.util.List<com.bucha.entity.IseLessonEntry> attempts = iseLessonEntryRepository
                .findByUser_IdAndLessonId(u.getId(), lessonId);

        java.util.Set<Long> attemptedLineExternalIds = attempts.stream().map(e -> e.getLineId())
                .filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());
        java.util.Set<Long> attemptedVocabExternalIds = attempts.stream().map(e -> e.getVocabularyId())
                .filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());

        java.util.List<Long> lessonLineExternalIds = conversationLineRepository.findExternalIdsByLessonId(lessonId);
        java.util.List<Long> lessonVocabExternalIds = vocabularyRepository.findExternalIdsByLessonId(lessonId);

        long totalLines = (lessonLineExternalIds == null) ? 0 : lessonLineExternalIds.size();
        long totalVocab = (lessonVocabExternalIds == null) ? 0 : lessonVocabExternalIds.size();

        // Count how many lesson external ids are present in user's attempts
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

        return ResponseEntity.ok(Map.of("completed", completed, "userDistinctLineCount", userDistinctLineCount,
                "userDistinctVocabCount", userDistinctVocabCount, "totalLines", totalLines, "totalVocab", totalVocab));
    }

    @PostMapping("/{lessonId}/complete")
    public ResponseEntity<?> completeLesson(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId, @RequestParam(value = "completed") boolean completed) {
        UserEntity u = userService.findById(principal.id()).orElseThrow();
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
        // Compute user's distinct completion counts for lines and vocabulary using
        // externalId values stored in IseLessonEntry and in the lesson content tables.
        java.util.List<com.bucha.entity.IseLessonEntry> attempts = iseLessonEntryRepository
                .findByUser_IdAndLessonId(u.getId(), lessonId);
        java.util.Set<Long> attemptedLineExternalIds = attempts.stream().map(e -> e.getLineId())
                .filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());
        java.util.Set<Long> attemptedVocabExternalIds = attempts.stream().map(e -> e.getVocabularyId())
                .filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());

        java.util.List<Long> lessonLineExternalIds = conversationLineRepository.findExternalIdsByLessonId(lessonId);
        java.util.List<Long> lessonVocabExternalIds = vocabularyRepository.findExternalIdsByLessonId(lessonId);

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

        if (completed) {
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
        log.info(ul.toString());
        userLessonRepository.save(ul);
        return ResponseEntity.ok(Map.of("status", "ok", "completed", ul.isCompleted(), "userDistinctLineCount",
                userDistinctLineCount,
                "userDistinctVocabCount", userDistinctVocabCount, "totalLines", totalLines, "totalVocab", totalVocab));
    }
}
