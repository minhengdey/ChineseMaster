package com.bucha.controller;

import com.bucha.dto.response.LessonSummaryResponse;
import com.bucha.dto.response.LessonDetailResponse;
import com.bucha.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping
    public ResponseEntity<List<LessonSummaryResponse>> list(@RequestParam(required = false) String level) {
        return ResponseEntity.ok(lessonService.list(level));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonDetailResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(lessonService.get(id));
    }
}
