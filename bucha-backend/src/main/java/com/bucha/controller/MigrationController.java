package com.bucha.controller;

import com.bucha.service.LessonMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/migration")
@RequiredArgsConstructor
public class MigrationController {

   private final LessonMigrationService migrationService;

   // Cloudinary-only mode: local dataile migration endpoints removed to avoid
   // confusion.

   @GetMapping("/conversationLineByLessionId/{lessionId}")
   public ResponseEntity<?> conversationLineByLessionId(@PathVariable("lessionId") Long lesstionId) {
      return ResponseEntity.ok(migrationService.getAllConversationLines(lesstionId));
   }

   /**
    * Return all conversation lines across all lessons when no lessonId is
    * provided.
    * Frontend daily mixed practice calls
    * /api/migration/conversationLineByLessionId (no path param)
    * so provide this mapping to keep compatibility.
    */
   @GetMapping({ "/conversationLineByLessionId", "/conversationLineByLessionId/" })
   public ResponseEntity<?> conversationLineAll() {
      return ResponseEntity.ok(migrationService.getAllConversationLines());
   }

   @GetMapping("/status")
   public ResponseEntity<?> getMigrationStatus() {
      return ResponseEntity.ok(Map.of(
            "status", "Migration service is running",
            "note", "Cloudinary-only mode: local JSON migration endpoints have been removed"));
   }
}