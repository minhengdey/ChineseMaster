package com.bucha.controller;

import com.bucha.dto.content.CurriculumDetailDto;
import com.bucha.dto.content.CurriculumDto;
import com.bucha.dto.content.LessonDetailDto;
import com.bucha.dto.content.LessonDto;
import com.bucha.dto.content.VocabularySearchItemDto;
import com.bucha.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

   /** Curriculums with lesson count (1 call instead of 1 + N). */
   @GetMapping("/curriculums/summary")
   public ResponseEntity<List<CurriculumDto>> getCurriculumsWithLessonCount() {
      return ResponseEntity.ok(contentService.getCurriculumsWithLessonCount());
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

   /**
    * Search vocabulary (word, pinyin, meaning, example). Min length 2. Paginated.
    * GET /api/content/vocabulary/search?q=...&page=0&size=24
    */
   @GetMapping("/vocabulary/search")
   public ResponseEntity<Page<VocabularySearchItemDto>> searchVocabulary(
         @RequestParam(value = "q", required = false, defaultValue = "") String q,
         @RequestParam(value = "page", defaultValue = "0") int page,
         @RequestParam(value = "size", defaultValue = "24") int size) {
      return ResponseEntity.ok(contentService.searchVocabulary(q, page, size));
   }

   /**
    * Paginated batch: GET /content/lessons/batch?page=0&size=24
    * Returns { content, totalElements, totalPages, number, size }.
    * Order: by curriculum id, then lesson order.
    */
   @GetMapping("/lessons/batch")
   public ResponseEntity<Page<LessonDetailDto>> getLessonsBatch(
         @RequestParam(value = "page", defaultValue = "0") int page,
         @RequestParam(value = "size", defaultValue = "24") int size,
         @RequestParam(value = "ids", required = false) List<Long> ids) {
      if (ids != null && !ids.isEmpty()) {
         List<LessonDetailDto> content = contentService.getLessonsByIds(ids);
         Pageable pageable = PageRequest.of(0, content.size());
         return ResponseEntity.ok(new org.springframework.data.domain.PageImpl<>(content, pageable, content.size()));
      }
      return ResponseEntity.ok(contentService.getLessonsPage(page, size));
   }

   // Debug: return conversation lines and their externalIds for a lesson
   @GetMapping("/debug/lessons/{id}/lines-external")
   public ResponseEntity<?> getLessonLinesExternal(@PathVariable Long id) {
      return ResponseEntity.ok(contentService.getConversationLinesWithExternalForLesson(id));
   }
}