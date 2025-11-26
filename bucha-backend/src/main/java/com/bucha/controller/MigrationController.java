package com.bucha.controller;

import com.bucha.dto.response.ConversationLinesResponse;
import com.bucha.service.LessonMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/migration")
@RequiredArgsConstructor
public class MigrationController {

   private final LessonMigrationService migrationService;

   @GetMapping("/conversationLineByLessionId/{lessionId}")
   public ResponseEntity<ConversationLinesResponse> conversationLineByLessionId(
         @PathVariable("lessionId") Long lessonId) {
      var lines = migrationService.getAllConversationLines(lessonId);
      var payload = ConversationLinesResponse.builder().lines(lines).count(lines.size()).build();
      return ResponseEntity.ok(payload);
   }

   @GetMapping({ "/conversationLineByLessionId", "/conversationLineByLessionId/" })
   public ResponseEntity<ConversationLinesResponse> conversationLineAll() {
      var lines = migrationService.getAllConversationLines();
      var payload = ConversationLinesResponse.builder().lines(lines).count(lines.size()).build();
      return ResponseEntity.ok(payload);
   }

   @GetMapping("/status")
   public ResponseEntity<com.bucha.dto.response.MigrationStatusResponse> getMigrationStatus() {
      return ResponseEntity.ok(com.bucha.dto.response.MigrationStatusResponse.builder()
            .status("Migration service is running")
            .note("Cloudinary-only mode: local JSON migration endpoints have been removed")
            .build());
   }
}