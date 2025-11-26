package com.bucha.controller;

import com.bucha.dto.response.UserLessonResponse;
// import com.bucha.dto.response.UserResponse; // removed after switching to mapper
// import com.bucha.dto.response.LessonResponse; // removed after switching to mapper
import com.bucha.dto.response.LessonCompletionStatusResponse;
import com.bucha.entity.Lesson;
import com.bucha.entity.User;
// import com.bucha.entity.UserLesson; // no longer used in controller
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.UserLessonService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
// import java.util.Objects; // no longer used

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// import java.time.LocalDateTime; // no longer used
import java.util.List;
// import java.util.stream.Collectors; // no longer used

@Slf4j
@RestController
@RequestMapping("/api/user-lessons")
public class UserLessonController {
    private final UserLessonService userLessonService;

    public UserLessonController(UserLessonService userLessonService) {
        this.userLessonService = userLessonService;
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<UserLessonResponse> getUserLesson(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(userLessonService.getOrCreateUserLessonResponse(principal.id(), lessonId));
    }

    @GetMapping("/list")
    public ResponseEntity<List<UserLessonResponse>> listUserLessons(
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userLessonService.listUserLessonsResponse(principal.id()));
    }

    @GetMapping("/{lessonId}/isCompleted")
    public ResponseEntity<LessonCompletionStatusResponse> isLessonCompleted(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId) {
        LessonCompletionStatusResponse status = userLessonService.computeCompletionStatus(principal.id(), lessonId);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/{lessonId}/complete")
    public ResponseEntity<LessonCompletionStatusResponse> completeLesson(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long lessonId, @RequestParam(value = "completed") boolean completed) {
        LessonCompletionStatusResponse status = userLessonService.completeLesson(principal.id(), lessonId, completed);
        return ResponseEntity.ok(status);
    }

    // Mapping moved to UserLessonMapper (MapStruct)
}
