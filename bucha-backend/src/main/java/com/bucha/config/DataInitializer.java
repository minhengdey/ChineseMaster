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

// helper imports for stable id
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

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

   // --- helper: stable id from hashing a seed string (path/content)
   private Long computeStableId(String seed) {
      if (seed == null)
         return null;
      try {
         MessageDigest md = MessageDigest.getInstance("SHA-256");
         byte[] hash = md.digest(seed.getBytes(StandardCharsets.UTF_8));
         byte[] first8 = Arrays.copyOf(hash, 8);
         long val = new BigInteger(1, first8).longValue();
         if (val == Long.MIN_VALUE)
            val = Math.abs(val + 1);
         return Math.abs(val);
      } catch (NoSuchAlgorithmException ex) {
         // fallback to hashCode if SHA-256 not available (very unlikely)
         return (long) Math.abs(seed.hashCode());
      }
   }

   // Try to set a stable id on the DTO using common setter/field names via
   // reflection.
   private void setStableIdOnDto(Object dto, Long id) {
      if (dto == null || id == null)
         return;
      try {
         // try setter setId(Long) or setId(long)
         try {
            Method m = dto.getClass().getMethod("setId", Long.class);
            m.invoke(dto, id);
            return;
         } catch (NoSuchMethodException ignore) {
         }
         try {
            Method m2 = dto.getClass().getMethod("setId", long.class);
            m2.invoke(dto, id);
            return;
         } catch (NoSuchMethodException ignore) {
         }

         // try setExternalId(Long)
         try {
            Method m3 = dto.getClass().getMethod("setExternalId", Long.class);
            m3.invoke(dto, id);
            return;
         } catch (NoSuchMethodException ignore) {
         }

         // try field "id"
         try {
            Field f = dto.getClass().getDeclaredField("id");
            f.setAccessible(true);
            if (f.getType() == Long.class || f.getType() == long.class) {
               f.set(dto, id);
               return;
            }
         } catch (NoSuchFieldException | IllegalAccessException ignore) {
         }

         // try field "externalId"
         try {
            Field f2 = dto.getClass().getDeclaredField("externalId");
            f2.setAccessible(true);
            if (f2.getType() == Long.class || f2.getType() == long.class) {
               f2.set(dto, id);
               return;
            }
         } catch (NoSuchFieldException | IllegalAccessException ignore) {
         }

         // if none matched, log debug
         logger.debug("Unable to set stable id on DTO of type {}", dto.getClass().getName());
      } catch (Exception e) {
         logger.debug("Error while setting stable id on DTO: {}", e.getMessage());
      }
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
               // compute stable id from content path so id remains stable across syncs
               Long stableLessonId = computeStableId(baseFolder + "/" + file);
               setStableIdOnDto(lesson, stableLessonId);

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
