package com.bucha.service;

import com.bucha.dto.CurriculumMetadataDto;
import com.bucha.dto.LessonMigrationDto;
import com.bucha.dto.MigrationPreviewDto;
import com.bucha.entity.*;
import com.bucha.repository.*;
import com.bucha.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonMigrationService {

   private final CurriculumRepository curriculumRepository;
   private final LessonRepository lessonRepository;
   private final ConversationRepository conversationRepository;
   private final ConversationLineRepository conversationLineRepository;
   private final VocabularyRepository vocabularyRepository;
   private final ObjectMapper objectMapper;

   @Transactional
   public void migrateFromJsonFiles(String uploadsPath, String curriculumName) {
      try {
         // Tạo hoặc lấy curriculum
         Curriculum curriculum = getOrCreateCurriculum(curriculumName);

         // Đọc tất cả file JSON trong thư mục uploads
         Path uploadsDir = Paths.get(uploadsPath);
         if (!Files.exists(uploadsDir)) {
            throw new RuntimeException("Uploads directory does not exist: " + uploadsPath);
         }

         try (Stream<Path> paths = Files.walk(uploadsDir)) {
            paths.filter(Files::isRegularFile)
                  .filter(path -> path.toString().endsWith(".json")
                        && !path.getFileName().toString().equals("metadata.json"))
                  .forEach(jsonFile -> {
                     try {
                        migrateLessonFromJsonFile(jsonFile, curriculum);
                     } catch (Exception e) {
                        log.error("Error migrating file: " + jsonFile, e);
                     }
                  });
         }

         log.info("Migration completed successfully for curriculum: {}", curriculumName);

      } catch (Exception e) {
         log.error("Migration failed", e);
         throw new RuntimeException("Migration failed: " + e.getMessage(), e);
      }
   }

   @Transactional
   public void migrateSingleJsonFile(String jsonFilePath, String curriculumName) {
      try {
         Curriculum curriculum = getOrCreateCurriculum(curriculumName);
         Path jsonPath = Paths.get(jsonFilePath);
         migrateLessonFromJsonFile(jsonPath, curriculum);
         log.info("Single file migration completed: {}", jsonFilePath);
      } catch (Exception e) {
         log.error("Single file migration failed: " + jsonFilePath, e);
         throw new RuntimeException("Migration failed: " + e.getMessage(), e);
      }
   }

   private void migrateLessonFromJsonFile(Path jsonFile, Curriculum curriculum) throws IOException {
      log.info("Processing JSON file: {}", jsonFile.getFileName());

      // Đọc và parse JSON
      LessonMigrationDto lessonDto = objectMapper.readValue(jsonFile.toFile(), LessonMigrationDto.class);

      // Bắt buộc phải có trường 'order'
      if (lessonDto.getOrder() == null) {
         log.warn("Skipping file: {}. Reason: Required field 'order' is missing.", jsonFile.getFileName());
         return; // Bỏ qua file này
      }

      // Kiểm tra xem lesson đã tồn tại chưa
      Lesson lesson = lessonRepository.findByCurriculumAndOrder(curriculum, lessonDto.getOrder())
            .orElse(new Lesson());

      // Cập nhật hoặc tạo mới Lesson
      lesson.setTitle(lessonDto.getTitle());
      lesson.setCurriculum(curriculum);
      lesson.setOrder(lessonDto.getOrder());

      // Nếu là lesson đã tồn tại, xóa dữ liệu cũ để ghi đè
      if (lesson.getId() != null) {
         lesson.getConversations().clear();
         lesson.getVocabularies().clear();
      }

      // Lưu lesson trước
      lesson = lessonRepository.save(lesson);

      // Migrate conversations
      if (lessonDto.getConversations() != null) {
         migrateConversations(lessonDto.getConversations(), lesson);
      }

      // Migrate vocabulary
      if (lessonDto.getVocabulary() != null) {
         migrateVocabulary(lessonDto.getVocabulary(), lesson);
      }

      log.info("Successfully migrated lesson: {}", lesson.getTitle());
   }

   private void migrateConversations(List<LessonMigrationDto.ConversationDto> conversationDtos, Lesson lesson) {
      AtomicInteger conversationOrder = new AtomicInteger(1);

      conversationDtos.forEach(conversationDto -> {
         Conversation conversation = new Conversation();
         conversation.setSection(conversationDto.getSection());
         conversation.setVnTranslation(conversationDto.getVnTranslation());
         conversation.setLesson(lesson);
         conversation.setOrder(conversationOrder.getAndIncrement());

         conversation = conversationRepository.save(conversation);

         // Migrate conversation lines
         if (conversationDto.getLines() != null) {
            migrateConversationLines(conversationDto.getLines(), conversation);
         }
      });
   }

   private void migrateConversationLines(List<LessonMigrationDto.ConversationDto.LineDto> lineDtos,
         Conversation conversation) {
      AtomicInteger lineOrder = new AtomicInteger(1);

      lineDtos.forEach(lineDto -> {
         ConversationLine line = new ConversationLine();
         line.setSpeaker(lineDto.getSpeaker());
         line.setZhText(lineDto.getZhText());
         line.setPinyin(lineDto.getPinyin());
         line.setVnTranslation(lineDto.getVnTranslation());
         line.setConversation(conversation);
         line.setOrder(lineOrder.getAndIncrement());

         conversationLineRepository.save(line);
      });
   }

   private void migrateVocabulary(List<LessonMigrationDto.VocabularyDto> vocabularyDtos, Lesson lesson) {
      AtomicInteger vocabularyOrder = new AtomicInteger(1);

      vocabularyDtos.forEach(vocabDto -> {
         Vocabulary vocabulary = new Vocabulary();
         vocabulary.setWord(vocabDto.getWord());
         vocabulary.setPinyin(vocabDto.getPinyin());
         vocabulary.setType(vocabDto.getType());
         vocabulary.setMeaning(vocabDto.getMeaning());
         vocabulary.setLesson(lesson);
         vocabulary.setOrder(vocabularyOrder.getAndIncrement());

         vocabularyRepository.save(vocabulary);
      });
   }

   private Curriculum getOrCreateCurriculum(String curriculumName) {
      return curriculumRepository.findByName(curriculumName)
            .orElseGet(() -> {
               Curriculum curriculum = new Curriculum();
               curriculum.setName(curriculumName);
               curriculum.setDescription("Auto-created curriculum from migration");
               curriculum.setLevel("Unknown");
               return curriculumRepository.save(curriculum);
            });
   }

   // Preview methods
   public MigrationPreviewDto previewMigrationFromJsonFiles(String uploadsPath, String curriculumName) {
      MigrationPreviewDto preview = new MigrationPreviewDto();
      preview.setCurriculumName(curriculumName);
      preview.setValid(true);

      MigrationPreviewDto.MigrationStats stats = new MigrationPreviewDto.MigrationStats();

      try {
         Path uploadsDir = Paths.get(uploadsPath);
         if (!Files.exists(uploadsDir)) {
            preview.setValid(false);
            preview.getErrors().add("Uploads directory does not exist: " + uploadsPath);
            return preview;
         }

         try (Stream<Path> paths = Files.walk(uploadsDir)) {
            List<Path> jsonFiles = paths.filter(Files::isRegularFile)
                  .filter(path -> path.toString().endsWith(".json"))
                  .toList();

            stats.setTotalFiles(jsonFiles.size());

            if (jsonFiles.isEmpty()) {
               preview.getWarnings().add("No JSON files found in directory: " + uploadsPath);
            }

            for (Path jsonFile : jsonFiles) {
               MigrationPreviewDto.LessonPreview lessonPreview = previewJsonFile(jsonFile);
               preview.getLessons().add(lessonPreview);

               if (lessonPreview.isValid()) {
                  stats.setValidFiles(stats.getValidFiles() + 1);
                  stats.setTotalLessons(stats.getTotalLessons() + 1);
                  stats.setTotalConversations(stats.getTotalConversations() + lessonPreview.getConversationCount());
                  stats.setTotalConversationLines(stats.getTotalConversationLines() + lessonPreview.getTotalLines());
                  stats.setTotalVocabulary(stats.getTotalVocabulary() + lessonPreview.getVocabularyCount());
               } else {
                  stats.setInvalidFiles(stats.getInvalidFiles() + 1);
                  preview.setValid(false);
                  preview.getErrors().addAll(lessonPreview.getErrors());
               }
            }
         }

      } catch (Exception e) {
         preview.setValid(false);
         preview.getErrors().add("Error during preview: " + e.getMessage());
         log.error("Preview failed", e);
      }

      preview.setStats(stats);
      return preview;
   }

   public MigrationPreviewDto previewSingleJsonFile(String jsonFilePath, String curriculumName) {
      MigrationPreviewDto preview = new MigrationPreviewDto();
      preview.setCurriculumName(curriculumName);
      preview.setValid(true);

      MigrationPreviewDto.MigrationStats stats = new MigrationPreviewDto.MigrationStats();
      stats.setTotalFiles(1);

      try {
         Path jsonPath = Paths.get(jsonFilePath);
         MigrationPreviewDto.LessonPreview lessonPreview = previewJsonFile(jsonPath);
         preview.getLessons().add(lessonPreview);

         if (lessonPreview.isValid()) {
            stats.setValidFiles(1);
            stats.setTotalLessons(1);
            stats.setTotalConversations(lessonPreview.getConversationCount());
            stats.setTotalConversationLines(lessonPreview.getTotalLines());
            stats.setTotalVocabulary(lessonPreview.getVocabularyCount());
         } else {
            stats.setInvalidFiles(1);
            preview.setValid(false);
            preview.getErrors().addAll(lessonPreview.getErrors());
         }

      } catch (Exception e) {
         preview.setValid(false);
         preview.getErrors().add("Error during preview: " + e.getMessage());
         log.error("Single file preview failed", e);
      }

      preview.setStats(stats);
      return preview;
   }

   private MigrationPreviewDto.LessonPreview previewJsonFile(Path jsonFile) {
      MigrationPreviewDto.LessonPreview lessonPreview = new MigrationPreviewDto.LessonPreview();
      lessonPreview.setFileName(jsonFile.getFileName().toString());
      lessonPreview.setValid(true);

      try {
         // Parse JSON
         LessonMigrationDto lessonDto = objectMapper.readValue(jsonFile.toFile(), LessonMigrationDto.class);

         // Validate lesson
         validateLessonData(lessonDto, lessonPreview);

         // Set basic info
         lessonPreview.setTitle(lessonDto.getTitle());

         // Process conversations
         if (lessonDto.getConversations() != null) {
            lessonPreview.setConversationCount(lessonDto.getConversations().size());
            int totalLines = 0;

            for (LessonMigrationDto.ConversationDto conv : lessonDto.getConversations()) {
               MigrationPreviewDto.LessonPreview.ConversationPreview convPreview = new MigrationPreviewDto.LessonPreview.ConversationPreview();
               convPreview.setSection(conv.getSection());
               convPreview.setVnTranslation(conv.getVnTranslation());

               if (conv.getLines() != null) {
                  convPreview.setLineCount(conv.getLines().size());
                  totalLines += conv.getLines().size();

                  // Collect unique speakers
                  List<String> speakers = conv.getLines().stream()
                        .map(LessonMigrationDto.ConversationDto.LineDto::getSpeaker)
                        .filter(StringUtils::hasText)
                        .distinct()
                        .toList();
                  convPreview.setSpeakers(speakers);
               }

               lessonPreview.getConversations().add(convPreview);
            }

            lessonPreview.setTotalLines(totalLines);
         }

         // Process vocabulary
         if (lessonDto.getVocabulary() != null) {
            lessonPreview.setVocabularyCount(lessonDto.getVocabulary().size());

            for (LessonMigrationDto.VocabularyDto vocab : lessonDto.getVocabulary()) {
               MigrationPreviewDto.LessonPreview.VocabularyPreview vocabPreview = new MigrationPreviewDto.LessonPreview.VocabularyPreview();
               vocabPreview.setWord(vocab.getWord());
               vocabPreview.setPinyin(vocab.getPinyin());
               vocabPreview.setType(vocab.getType());
               vocabPreview.setMeaning(vocab.getMeaning());

               lessonPreview.getVocabulary().add(vocabPreview);
            }
         }

      } catch (Exception e) {
         lessonPreview.setValid(false);
         lessonPreview.getErrors().add("Failed to parse JSON file: " + e.getMessage());
         log.error("Error parsing file: " + jsonFile, e);
      }

      return lessonPreview;
   }

   private void validateLessonData(LessonMigrationDto lessonDto, MigrationPreviewDto.LessonPreview lessonPreview) {
      // Validate title
      if (!StringUtils.hasText(lessonDto.getTitle())) {
         lessonPreview.setValid(false);
         lessonPreview.getErrors().add("Lesson title is required");
      }

      // Validate conversations
      if (lessonDto.getConversations() == null || lessonDto.getConversations().isEmpty()) {
         lessonPreview.getWarnings().add("No conversations found in lesson");
      } else {
         for (int i = 0; i < lessonDto.getConversations().size(); i++) {
            LessonMigrationDto.ConversationDto conv = lessonDto.getConversations().get(i);
            String prefix = "Conversation " + (i + 1) + ": ";

            if (!StringUtils.hasText(conv.getSection())) {
               lessonPreview.setValid(false);
               lessonPreview.getErrors().add(prefix + "Section is required");
            }

            if (conv.getLines() == null || conv.getLines().isEmpty()) {
               lessonPreview.getWarnings().add(prefix + "No conversation lines found");
            } else {
               validateConversationLines(conv.getLines(), lessonPreview, prefix);
            }
         }
      }

      // Validate vocabulary
      if (lessonDto.getVocabulary() == null || lessonDto.getVocabulary().isEmpty()) {
         lessonPreview.getWarnings().add("No vocabulary found in lesson");
      } else {
         validateVocabulary(lessonDto.getVocabulary(), lessonPreview);
      }
   }

   private void validateConversationLines(List<LessonMigrationDto.ConversationDto.LineDto> lines,
         MigrationPreviewDto.LessonPreview lessonPreview, String prefix) {
      for (int i = 0; i < lines.size(); i++) {
         LessonMigrationDto.ConversationDto.LineDto line = lines.get(i);
         String linePrefix = prefix + "Line " + (i + 1) + ": ";

         if (!StringUtils.hasText(line.getSpeaker())) {
            lessonPreview.setValid(false);
            lessonPreview.getErrors().add(linePrefix + "Speaker is required");
         }

         if (!StringUtils.hasText(line.getZhText())) {
            lessonPreview.setValid(false);
            lessonPreview.getErrors().add(linePrefix + "Chinese text is required");
         }

         if (!StringUtils.hasText(line.getPinyin())) {
            lessonPreview.getWarnings().add(linePrefix + "Pinyin is missing");
         }

         if (!StringUtils.hasText(line.getVnTranslation())) {
            lessonPreview.getWarnings().add(linePrefix + "Vietnamese translation is missing");
         }
      }
   }

   private void validateVocabulary(List<LessonMigrationDto.VocabularyDto> vocabulary,
         MigrationPreviewDto.LessonPreview lessonPreview) {
      for (int i = 0; i < vocabulary.size(); i++) {
         LessonMigrationDto.VocabularyDto vocab = vocabulary.get(i);
         String prefix = "Vocabulary " + (i + 1) + ": ";

         if (!StringUtils.hasText(vocab.getWord())) {
            lessonPreview.setValid(false);
            lessonPreview.getErrors().add(prefix + "Word is required");
         }

         if (!StringUtils.hasText(vocab.getPinyin())) {
            lessonPreview.getWarnings().add(prefix + "Pinyin is missing for word: " + vocab.getWord());
         }

         if (!StringUtils.hasText(vocab.getMeaning())) {
            lessonPreview.setValid(false);
            lessonPreview.getErrors().add(prefix + "Meaning is required for word: " + vocab.getWord());
         }

         if (!StringUtils.hasText(vocab.getType())) {
            lessonPreview.getWarnings().add(prefix + "Word type is missing for word: " + vocab.getWord());
         }
      }
   }

   @Transactional
   public Curriculum getOrCreateCurriculumFromMetadata(Path curriculumPath) {
      try {
         Path metadataPath = curriculumPath.resolve("metadata.json");
         if (!Files.exists(metadataPath)) {
            log.warn("Curriculum metadata file not found: {}. Skipping this curriculum.", metadataPath);
            return null;
         }

         CurriculumMetadataDto metadata = objectMapper.readValue(metadataPath.toFile(), CurriculumMetadataDto.class);

         // Bắt buộc phải có order
         if (metadata.getOrder() == null) {
            log.warn("Curriculum metadata missing required 'order' field in: {}. Skipping.", metadataPath);
            return null;
         }

         if (!StringUtils.hasText(metadata.getName())) {
            log.warn("Curriculum metadata missing required 'name' field in: {}. Skipping.", metadataPath);
            return null;
         }

         // UPSERT: Tìm theo order, nếu không có thì tạo mới
         return curriculumRepository.findByOrder(metadata.getOrder())
               .map(curriculum -> {
                  // CẬP NHẬT curriculum hiện có
                  curriculum.setName(metadata.getName());
                  curriculum.setDescription(metadata.getDescription());
                  curriculum.setLevel(metadata.getLevel());

                  // Xóa tất cả lessons cũ để ghi đè hoàn toàn
                  curriculum.getLessons().clear();

                  log.info("Updating existing curriculum with order: {}", metadata.getOrder());
                  return curriculumRepository.save(curriculum);
               })
               .orElseGet(() -> {
                  // TẠO MỚI curriculum
                  Curriculum curriculum = new Curriculum();
                  curriculum.setName(metadata.getName());
                  curriculum.setDescription(metadata.getDescription());
                  curriculum.setLevel(metadata.getLevel());
                  curriculum.setOrder(metadata.getOrder());
                  log.info("Creating new curriculum: {}", metadata.getName());
                  return curriculumRepository.save(curriculum);
               });

      } catch (IOException e) {
         log.error("Failed to read curriculum metadata from: {}", curriculumPath, e);
         return null;
      }
   }
}