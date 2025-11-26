package com.bucha.controller;

import com.bucha.dto.response.CurriculumResponse;
import com.bucha.dto.response.CurriculumDetailResponse;
import com.bucha.dto.response.LessonResponse;
import com.bucha.dto.response.LessonDetailResponse;
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
   public ResponseEntity<List<CurriculumResponse>> getAllCurriculums() {
      List<CurriculumResponse> data = contentService.getAllCurriculums();
      return ResponseEntity.ok(data);
   }

   @GetMapping("/curriculums/{id}")
   public ResponseEntity<CurriculumDetailResponse> getCurriculumById(@PathVariable Long id) {
      CurriculumDetailResponse data = contentService.getCurriculumById(id);
      return ResponseEntity.ok(data);
   }

   // Lesson endpoints
   @GetMapping("/curriculums/{id}/lessons")
   public ResponseEntity<List<LessonResponse>> getLessonsByCurriculumId(@PathVariable Long id) {
      List<LessonResponse> data = contentService.getLessonsByCurriculumId(id);
      return ResponseEntity.ok(data);
   }

   @GetMapping("/lessons/{id}")
   public ResponseEntity<LessonDetailResponse> getLessonById(@PathVariable Long id) {
      LessonDetailResponse data = contentService.getLessonById(id);
      return ResponseEntity.ok(data);
   }

   // Debug: return conversation lines and their externalIds for a lesson (kept for
   // troubleshooting)
   @GetMapping("/debug/lessons/{id}/lines-external")
   public ResponseEntity<?> getLessonLinesExternal(@PathVariable Long id) {
      return ResponseEntity.ok(contentService.getConversationLinesWithExternalForLesson(id));
   }
}