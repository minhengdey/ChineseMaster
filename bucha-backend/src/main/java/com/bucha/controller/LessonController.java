package com.bucha.controller;

import com.bucha.dto.LessonDtos.LessonSummary;
import com.bucha.dto.LessonDtos.LessonDetail;
import com.bucha.repository.LessonRepository;
import com.bucha.entity.Lesson;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonRepository lessonRepository;

    public LessonController(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    @GetMapping
    public ResponseEntity<List<LessonSummary>> list(@RequestParam(required = false) String level) {
        List<Lesson> lessons = (level == null) ? lessonRepository.findAll() : lessonRepository.findByLevel(level);
        List<LessonSummary> dtos = lessons.stream().map(this::toSummary).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonDetail> get(@PathVariable Long id) {
        return lessonRepository.findById(id)
                .map(this::toDetail)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private LessonSummary toSummary(Lesson l) {
        LessonSummary dto = new LessonSummary();
        dto.id = l.getId();
        dto.title = l.getTitle();
        dto.level = l.getLevel();
        return dto;
    }

    private LessonDetail toDetail(Lesson l) {
        LessonDetail dto = new LessonDetail();
        dto.id = l.getId();
        dto.title = l.getTitle();
        dto.level = l.getLevel();
        dto.content = l.getContent();
        dto.audioFiles = l.getAudioAssets() != null
                ? l.getAudioAssets().stream().map(a -> a.getFilename()).collect(Collectors.toList())
                : List.of();
        return dto;
    }
}
