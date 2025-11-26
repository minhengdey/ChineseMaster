package com.bucha.config;

import com.bucha.entity.Curriculum;
import com.bucha.service.LessonMigrationService;
import com.bucha.service.CloudinaryService;
import com.bucha.dto.CurriculumMetadataDto;
import com.bucha.dto.migration.ConversationMigrationDTO;
import com.bucha.dto.migration.LessonMigrationDTO;
import com.bucha.dto.migration.LineMigrationDTO;
import com.bucha.dto.migration.VocabularyMigrationDTO;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import com.bucha.dto.migration.pronunciation.PronunciationDto;
import com.bucha.dto.migration.pronunciation.InitialSoundMigrationDto;
import com.bucha.dto.migration.pronunciation.FinalSoundMigrationDto;
import com.bucha.dto.migration.pronunciation.ToneMigrationDto;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {

   static Logger logger = LoggerFactory.getLogger(DataInitializer.class);

   LessonMigrationService lessonMigrationService;
   CloudinaryService cloudinaryService;

   @NonFinal
   @Value("${app.data.initializer.enabled:false}")
   boolean enabled;

   @NonFinal
   @Value("${app.data.initializer.curricula:1}")
   String curriculaCsv;

   @NonFinal
   @Value("${app.data.initializer.curriculum-base-path:chinese-master/curriculumn}")
   String curriculumBasePath;

   @NonFinal
   @Value("${app.data.initializer.base-path:chinese-master}")
   String basePath;

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
         Long stableCurriculumId = computeStableId(curriculumBasePath + "/" + slug);

         try {
            String baseFolder = curriculumBasePath + "/" + slug;
            CurriculumMetadataDto metadata = cloudinaryService
                  .fetchCurriculumMetadataDto(baseFolder + "/metadata.json");
            metadata.setId(stableCurriculumId);
            Curriculum curriculum = lessonMigrationService.getOrCreateCurriculumFromMetadata(metadata);
            if (curriculum == null) {
               logger.warn("Skip curriculum '{}' due to invalid metadata", slug);
               continue;
            }

            List<String> lessonFiles = metadata.getLessons();
            if (lessonFiles == null || lessonFiles.isEmpty()) {
               logger.warn("No lessonFiles in metadata for curriculumn slug='{}'", slug);
               continue;
            }

            AtomicInteger lessonOrder = new AtomicInteger(1);
            for (String lf : lessonFiles) {
               String file = lf == null ? null : lf.trim();
               if (file == null || file.isEmpty())
                  continue;
               LessonMigrationDTO lesson = cloudinaryService.fetchLessonMigrationDto(baseFolder + "/" + file);
               if (lesson == null) {
                  logger.warn("Cannot fetch lesson '{}' for slug='{}'", file, slug);
                  continue;
               }
               Long stableLessonId = computeStableId(baseFolder + "/" + file);
               lesson.setId(stableLessonId);
               lesson.setOrder(lessonOrder.getAndIncrement());
               String audioRoot = baseFolder + "/audio";

               AtomicInteger convOrder = new AtomicInteger(1);
               for (ConversationMigrationDTO conv : lesson.getConversations()) {
                  conv.setOrder(convOrder.getAndIncrement());
                  conv.setId(computeStableId(audioRoot + "/"
                        + String.format("lesson-%d-conv-%d", lesson.getOrder(), conv.getOrder())));
                  for (int i = 0; i < conv.getLines().size(); i++) {
                     LineMigrationDTO line = conv.getLines().get(i);
                     line.setOrder(i + 1);
                     line.setId(computeStableId(audioRoot + "/"
                           + String.format("lesson-%d_conv-%d_line-%d", lesson.getOrder(), conv.getOrder(),
                                 line.getOrder())));
                  }
               }

               AtomicInteger vocabOrder = new AtomicInteger(1);
               for (VocabularyMigrationDTO vocab : lesson.getVocabulary()) {
                  vocab.setId(computeStableId(audioRoot + "/"
                        + String.format("lesson-%d-vocab-%d", lesson.getOrder(), vocabOrder.get())));
                  if (vocab.getExample() != null) {
                     vocab.getExample().setId(computeStableId(audioRoot + "/"
                           + String.format("lesson-%d_vocab-%d_example", lesson.getOrder(), vocabOrder.get())));
                  }
                  vocab.setOrder(vocabOrder.get());
                  vocabOrder.incrementAndGet();
               }
               lessonMigrationService.migrateLesson(lesson, curriculum, audioRoot);
            }

            logger.info("Migrated curriculum '{}' from Cloudinary", slug);
         } catch (Exception ex) {
            logger.error("Error migrating curriculum '{}' from Cloudinary", slug, ex);
         }
      }
      try {
         String pronunciationPath = basePath + "/sound-pronunciation.json";
         PronunciationDto pDto = cloudinaryService.fetchPronunciationDto(pronunciationPath);
         if (pDto != null) {
            long idx = 1;
            if (pDto.getInitials() != null) {
               for (InitialSoundMigrationDto isd : pDto.getInitials()) {
                  Long stableId = computeStableId(pronunciationPath + "/initial_" + idx);
                  isd.setId(stableId);
                  idx++;
               }
            }

            idx = 1;
            if (pDto.getFinals() != null) {
               for (FinalSoundMigrationDto fsd : pDto.getFinals()) {
                  Long stableId = computeStableId(pronunciationPath + "/final_" + idx);
                  fsd.setId(stableId);
                  idx++;
               }
            }

            idx = 1;
            if (pDto.getTones() != null) {
               for (ToneMigrationDto td : pDto.getTones()) {
                  Long stableId = computeStableId(pronunciationPath + "/tone_" + idx);
                  td.setId(stableId);
                  idx++;
               }
            }

            lessonMigrationService.migratePronunciation(pDto);
         }
      } catch (Exception ex) {
         logger.warn("Pronunciation JSON not found or failed to parse pronunction {}",
               ex.getMessage());
      }
   }

}
