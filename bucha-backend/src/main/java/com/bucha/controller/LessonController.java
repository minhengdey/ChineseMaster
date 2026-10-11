package com.bucha.controller;

import com.bucha.dto.lesson.LessonDtos.LessonDetail;
import com.bucha.dto.lesson.LessonDtos.LessonSummary;
import com.bucha.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping
    public ResponseEntity<List<LessonSummary>> list(@RequestParam(required = false) String level) {
        return ResponseEntity.ok(lessonService.list(level));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonDetail> get(@PathVariable Long id) {
        return lessonService.get(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
