package com.bucha.controller;

import com.bucha.dto.content.CurriculumDetailDto;
import com.bucha.dto.content.CurriculumDto;
import com.bucha.dto.content.LessonDetailDto;
import com.bucha.dto.content.LessonDto;
import com.bucha.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class ContentController {

   private final ContentService contentService;

   // Curriculum endpoints
   @GetMapping("/curriculums")
   public ResponseEntity<List<CurriculumDto>> getAllCurriculums() {
      return ResponseEntity.ok(contentService.getAllCurriculums());
   }

   @GetMapping("/curriculums/{id}")
   public ResponseEntity<CurriculumDetailDto> getCurriculumById(@PathVariable Long id) {
      return ResponseEntity.ok(contentService.getCurriculumById(id));
   }

   // Lesson endpoints
   @GetMapping("/curriculums/{id}/lessons")
   public ResponseEntity<List<LessonDto>> getLessonsByCurriculumId(@PathVariable Long id) {
      return ResponseEntity.ok(contentService.getLessonsByCurriculumId(id));
   }

   @GetMapping("/lessons/{id}")
   public ResponseEntity<LessonDetailDto> getLessonById(@PathVariable Long id) {
      return ResponseEntity.ok(contentService.getLessonById(id));
   }
}