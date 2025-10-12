package com.bucha.config;

import com.bucha.entity.Curriculum;
import com.bucha.service.LessonMigrationService;
import com.bucha.service.CloudinaryService;
import com.bucha.dto.CurriculumMetadataDto;
import com.bucha.dto.migration.LessonMigrationDTO;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// Local filesystem imports removed (Cloudinary-only mode)

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

   private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

   private final LessonMigrationService lessonMigrationService;
   private final CloudinaryService cloudinaryService;

   @Value("${app.data.initializer.enabled:false}")
   private boolean enabled;

   @Value("${app.data.initializer.source:CLOUDINARY}")
   private String source;

   @Value("${app.data.initializer.curricula:1}")
   private String curriculaCsv; // comma separated slugs

   @Value("${app.data.initializer.curriculum-base-path:chinese-master/curriculumn}")
   private String curriculumBasePath;

   @Override
   public void run(String... args) {
      logger.info("Checking if data initialization is enabled...");

      if (!enabled) {
         logger.info("Data initialization is disabled. Skipping.");
         return;
      }

      migrateFromCloudinary();

      logger.info("Automatic data migration process finished.");
   }

   private void migrateFromCloudinary() {
      logger.info("Starting Cloudinary-based migration...");
      if (curriculaCsv == null || curriculaCsv.isBlank()) {
         logger.warn("No curricula provided for Cloudinary migration (app.data.initializer.curricula). Skipping.");
         return;
      }

      String[] slugs = curriculaCsv.split(",");
      for (String raw : slugs) {
         String slug = raw.trim();
         if (slug.isEmpty())
            continue;

         try {
            String baseFolder = curriculumBasePath + "/" + slug;
            CurriculumMetadataDto metadata = cloudinaryService
                  .fetchCurriculumMetadataDto(baseFolder + "/metadata.json");
            Curriculum curriculum = lessonMigrationService.getOrCreateCurriculumFromMetadata(metadata);
            if (curriculum == null) {
               logger.warn("Skip curriculum '{}' due to invalid metadata", slug);
               continue;
            }

            List<String> lessonFiles = metadata != null ? metadata.getLessons() : null;
            if (lessonFiles == null || lessonFiles.isEmpty()) {
               logger.warn("No lessonFiles in metadata for curriculumn slug='{}'", slug);
               continue;
            }

            for (String lf : lessonFiles) {
               String file = lf == null ? null : lf.trim();
               if (file == null || file.isEmpty())
                  continue;
               LessonMigrationDTO lesson = cloudinaryService.fetchLessonMigrationDto(baseFolder + "/" + file);
               if (lesson == null) {
                  logger.warn("Cannot fetch lesson '{}' for slug='{}'", file, slug);
                  continue;
               }
               String audioRoot = baseFolder + "/audio";
               lessonMigrationService.migrateLesson(lesson, curriculum, audioRoot);
            }

            logger.info("Migrated curriculum '{}' from Cloudinary", slug);
         } catch (Exception ex) {
            logger.error("Error migrating curriculum '{}' from Cloudinary", slug, ex);
         }
      }
   }

}
