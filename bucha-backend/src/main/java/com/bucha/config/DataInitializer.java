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
import java.util.Optional;
import java.security.NoSuchAlgorithmException;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import com.bucha.dto.migration.pronunciation.PronunciationDto;
import com.bucha.dto.migration.pronunciation.InitialSoundDto;
import com.bucha.dto.migration.pronunciation.FinalSoundDto;
import com.bucha.dto.migration.pronunciation.ToneDto;
import com.bucha.entity.InitialSound;
import com.bucha.entity.FinalSound;
import com.bucha.entity.Tone;
import com.bucha.repository.InitialSoundRepository;
import com.bucha.repository.FinalSoundRepository;
import com.bucha.repository.ToneRepository;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

   private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

   private final LessonMigrationService lessonMigrationService;
   private final CloudinaryService cloudinaryService;
   // Repositories are not used here; migration service will persist pronunciation
   // entities

   @Value("${app.data.initializer.enabled:false}")
   private boolean enabled;

   @Value("${app.data.initializer.source:CLOUDINARY}")
   private String source;

   @Value("${app.data.initializer.curricula:1}")
   private String curriculaCsv; // comma separated slugs

   @Value("${app.data.initializer.curriculum-base-path:chinese-master/curriculumn}")
   private String curriculumBasePath;

   @Value("${app.data.initializer.base-path:chinese-master}")
   private String basePath;

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

   private String canonicalizeJson(Object obj) {
      try {
         com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
         mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
         return mapper.writeValueAsString(obj);
      } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
         throw new RuntimeException(e);
      }
   }

   private String computeSha256Hex(String input) {
      try {
         java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
         byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
         StringBuilder hexString = new StringBuilder(2 * hash.length);
         for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1)
               hexString.append('0');
            hexString.append(hex);
         }
         return hexString.toString();
      } catch (java.security.NoSuchAlgorithmException e) {
         throw new RuntimeException(e);
      }
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
      // Pronunciation guide (if exists at basePath/sound-pronunciation.json)
      try {
         String pronunciationPath = basePath + "/sound-pronunciation.json";
         PronunciationDto pDto = cloudinaryService.fetchPronunciationDto(pronunciationPath);
         if (pDto != null) {
            long idx = 1;
            if (pDto.getInitials() != null) {
               for (InitialSoundDto isd : pDto.getInitials()) {
                  Long stableId = computeStableId(pronunciationPath + "/initial_" + idx);
                  isd.setId(stableId);
                  idx++;
               }
            }

            idx = 1;
            if (pDto.getFinals() != null) {
               for (FinalSoundDto fsd : pDto.getFinals()) {
                  Long stableId = computeStableId(pronunciationPath + "/final_" + idx);
                  fsd.setId(stableId);
                  idx++;
               }
            }

            idx = 1;
            if (pDto.getTones() != null) {
               for (ToneDto td : pDto.getTones()) {
                  Long stableId = computeStableId(pronunciationPath + "/tone_" + idx);
                  td.setId(stableId);
                  idx++;
               }
            }

            // Delegate persistence to migration service
            lessonMigrationService.migratePronunciation(pDto);
         }
      } catch (Exception ex) {
         logger.warn("Pronunciation JSON not found or failed to parse pronunction {}",
               ex.getMessage());
      }
   }

}
