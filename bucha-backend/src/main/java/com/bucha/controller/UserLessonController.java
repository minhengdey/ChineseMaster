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

    public UserLessonController(UserService userService, LessonRepository lessonRepository,
            UserLessonRepository userLessonRepository, IseLessonEntryRepository iseLessonEntryRepository,
            ConversationLineRepository conversationLineRepository) {
        this.userService = userService;
        this.lessonRepository = lessonRepository;
        this.userLessonRepository = userLessonRepository;
        this.iseLessonEntryRepository = iseLessonEntryRepository;
        this.conversationLineRepository = conversationLineRepository;
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
        long scored = iseLessonEntryRepository.countDistinctAttemptsByUserAndLesson(u.getId(), lessonId);
        long totalLines = conversationLineRepository.countByLessonId(lessonId);
        boolean completed = (scored >= totalLines && totalLines > 0);
        return ResponseEntity.ok(Map.of("completed", completed, "scoredCount", scored, "totalLines", totalLines));
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
        // Determine scored count and total lines for the lesson
        long scoredCount = iseLessonEntryRepository.countDistinctAttemptsByUserAndLesson(u.getId(), lessonId);
        long totalLines = conversationLineRepository.countByLessonId(lessonId);

        if (completed) {
            ul.setCompleted(true);
            ul.setInProgress(false);
            ul.setCompletedAt(LocalDateTime.now());
        } else {
            // If user already has scored >= totalLines, auto-mark completed
            if (totalLines > 0 && scoredCount >= totalLines) {
                ul.setCompleted(true);
                ul.setInProgress(false);
                ul.setCompletedAt(LocalDateTime.now());
            } else if (scoredCount > 0 && scoredCount < totalLines) {
                // in progress when some attempts exist but not all
                ul.setInProgress(true);
                ul.setCompleted(false);
            } else {
                ul.setInProgress(false);
                ul.setCompleted(false);
            }
        }
        log.info(ul.toString());
        userLessonRepository.save(ul);
        return ResponseEntity.ok(Map.of("status", "ok", "completed", ul.isCompleted(), "scoredCount", scoredCount,
                "totalLines", totalLines));
    }
}
