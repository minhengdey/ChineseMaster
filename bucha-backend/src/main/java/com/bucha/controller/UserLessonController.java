package com.bucha.controller;

import com.bucha.dto.userlesson.LessonCompletionDto;
import com.bucha.dto.userlesson.UserLessonDto;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.UserLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user-lessons")
@RequiredArgsConstructor
public class UserLessonController {

    private final UserLessonService userLessonService;

    @GetMapping("/{lessonId}")
    public ResponseEntity<UserLessonDto> getUserLesson(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(userLessonService.getOrCreateUserLesson(principal.id(), lessonId));
    }

    /** Batch completion. Query param: lessonIds=1,2,3 */
    @GetMapping("/completion")
    public ResponseEntity<Map<String, LessonCompletionDto>> getCompletionBatch(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "lessonIds", required = false) String lessonIdsParam) {
        return ResponseEntity.ok(userLessonService.getCompletionBatch(principal.id(), lessonIdsParam));
    }

    @GetMapping("/{lessonId}/isCompleted")
    public ResponseEntity<LessonCompletionDto> isLessonCompleted(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(userLessonService.computeCompletion(principal.id(), lessonId));
    }

    @PostMapping("/{lessonId}/complete")
    public ResponseEntity<Map<String, Object>> completeLesson(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId,
            @RequestParam(value = "completed") boolean completed) {
        return ResponseEntity.ok(userLessonService.completeLesson(principal.id(), lessonId, completed));
    }
}
