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

   @PostMapping("/lessons/bulk")
   public ResponseEntity<?> migrateAllLessons(
         @RequestParam(defaultValue = "uploads") String uploadsPath,
         @RequestParam(defaultValue = "HSK 1") String curriculumName) {
      try {
         log.info("Starting bulk migration from path: {} for curriculum: {}", uploadsPath, curriculumName);
         migrationService.migrateFromJsonFiles(uploadsPath, curriculumName);

         return ResponseEntity.ok(Map.of(
               "success", true,
               "message", "Migration completed successfully",
               "curriculum", curriculumName,
               "source", uploadsPath));
      } catch (Exception e) {
         log.error("Migration failed", e);
         return ResponseEntity.badRequest().body(Map.of(
               "success", false,
               "message", "Migration failed: " + e.getMessage()));
      }
   }

   @PostMapping("/lessons/single")
   public ResponseEntity<?> migrateSingleLesson(
         @RequestParam String jsonFilePath,
         @RequestParam(defaultValue = "HSK 1") String curriculumName) {
      try {
         log.info("Starting single file migration: {} for curriculum: {}", jsonFilePath, curriculumName);
         migrationService.migrateSingleJsonFile(jsonFilePath, curriculumName);

         return ResponseEntity.ok(Map.of(
               "success", true,
               "message", "Single file migration completed successfully",
               "curriculum", curriculumName,
               "file", jsonFilePath));
      } catch (Exception e) {
         log.error("Single file migration failed", e);
         return ResponseEntity.badRequest().body(Map.of(
               "success", false,
               "message", "Migration failed: " + e.getMessage()));
      }
   }

   @GetMapping("/lessons/bulk/preview")
   public ResponseEntity<?> previewBulkMigration(
         @RequestParam(defaultValue = "uploads") String uploadsPath,
         @RequestParam(defaultValue = "HSK 1") String curriculumName) {
      try {
         log.info("Starting bulk migration preview from path: {} for curriculum: {}", uploadsPath, curriculumName);
         var preview = migrationService.previewMigrationFromJsonFiles(uploadsPath, curriculumName);

         return ResponseEntity.ok(preview);
      } catch (Exception e) {
         log.error("Preview failed", e);
         return ResponseEntity.badRequest().body(Map.of(
               "success", false,
               "message", "Preview failed: " + e.getMessage()));
      }
   }

   @GetMapping("/lessons/single/preview")
   public ResponseEntity<?> previewSingleMigration(
         @RequestParam String jsonFilePath,
         @RequestParam(defaultValue = "HSK 1") String curriculumName) {
      try {
         log.info("Starting single file migration preview: {} for curriculum: {}", jsonFilePath, curriculumName);
         var preview = migrationService.previewSingleJsonFile(jsonFilePath, curriculumName);

         return ResponseEntity.ok(preview);
      } catch (Exception e) {
         log.error("Single file preview failed", e);
         return ResponseEntity.badRequest().body(Map.of(
               "success", false,
               "message", "Preview failed: " + e.getMessage()));
      }
   }

   @GetMapping("/status")
   public ResponseEntity<?> getMigrationStatus() {
      return ResponseEntity.ok(Map.of(
            "status", "Migration service is running",
            "endpoints", Map.of(
                  "bulk_preview", "GET /api/migration/lessons/bulk/preview?uploadsPath=uploads&curriculumName=HSK 1",
                  "single_preview",
                  "GET /api/migration/lessons/single/preview?jsonFilePath=path/to/file.json&curriculumName=HSK 1",
                  "bulk_migration", "POST /api/migration/lessons/bulk?uploadsPath=uploads&curriculumName=HSK 1",
                  "single_migration",
                  "POST /api/migration/lessons/single?jsonFilePath=path/to/file.json&curriculumName=HSK 1")));
   }
}