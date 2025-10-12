package com.bucha.service;

import com.bucha.dto.CurriculumMetadataDto;
import com.bucha.dto.migration.ConversationMigrationDTO;
import com.bucha.dto.migration.LessonMigrationDTO;
import com.bucha.dto.migration.LineDto;
import com.bucha.dto.migration.VocabularyMigrationDTO;
import com.bucha.entity.*;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.val;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonMigrationService {

   private final CurriculumRepository curriculumRepository;
   private final LessonRepository lessonRepository;
   private final ConversationRepository conversationRepository;
   private final ConversationLineRepository conversationLineRepository;
   private final VocabularyRepository vocabularyRepository;
   private final LineRepository lineRepository;

   // Local file migration removed (Cloudinary-only mode)

   // Local file parsing removed; use migrateLessonFromDto instead.

   // Public for cloud migration
   @Transactional
   public Lesson migrateLesson(LessonMigrationDTO lessonDto, Curriculum curriculum, String audioRootPublicId) {
      if (lessonDto == null)
         return null;

      // Bắt buộc phải có trường 'order'
      if (lessonDto.getOrder() == null) {
         log.warn("Skipping lesson DTO. Reason: Required field 'order' is missing.");
         return null; // Bỏ qua file này
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

      AtomicInteger convOrdinal = new AtomicInteger(1);
      if (lessonDto.getConversations() != null) {
         for (ConversationMigrationDTO convDto : lessonDto.getConversations()) {
            int convOrder = convOrdinal.getAndIncrement();
            Conversation conv = new Conversation();
            conv.setOrder(convOrder);
            conv.setLesson(lesson);
            try {
               conv.setSection(convDto.getSection());
            } catch (Exception ignore) {
            }
            try {
               conv.setVnTranslation(convDto.getVnTranslation());
            } catch (Exception ignore) {
            }
            conv = conversationRepository.save(conv);

            AtomicInteger lineOrdinal = new AtomicInteger(1);
            if (convDto.getLines() != null) {
               for (LineDto lineDto : convDto.getLines()) {
                  int lineOrder = lineOrdinal.getAndIncrement();
                  ConversationLine line = new ConversationLine();
                  line.setConversation(conv);
                  line.setOrder(lineOrder);
                  line.setSpeaker(lineDto.getSpeaker());
                  line.setZhText(lineDto.getZh());
                  line.setPinyin(lineDto.getPinyin());
                  line.setVnTranslation(lineDto.getVn());
                  // derive audio public id from pattern
                  if (audioRootPublicId != null && lessonDto.getOrder() != null) {
                     String pid = String.format("%s/lesson-%d_conv-%d_line-%d", audioRootPublicId,
                           lessonDto.getOrder(), convOrder, lineOrder);
                     line.setAudioPublicId(pid);
                  }
                  conversationLineRepository.save(line);
               }
            }
         }
      }

      // Vocabulary
      AtomicInteger vocabOrdinal = new AtomicInteger(1);
      if (lessonDto.getVocabulary() != null) {

         for (VocabularyMigrationDTO vDto : lessonDto.getVocabulary()) {
            Line exampleLine = null;
            if (vDto.getExample() != null) {
               exampleLine = new Line();
               exampleLine.setZhText(vDto.getExample().getZh());
               exampleLine.setPinyin(vDto.getExample().getPinyin());
               exampleLine.setVnTranslation(vDto.getExample().getVn());
               if (audioRootPublicId != null && lessonDto.getOrder() != null) {
                  String pid = String.format("%s/lesson-%d_vocab-%d_example", audioRootPublicId,
                        lessonDto.getOrder(), vocabOrdinal.get());
                  exampleLine.setAudioPublicId(pid);
               }
               exampleLine = lineRepository.save(exampleLine);
            }

            int vocabOrder = vocabOrdinal.getAndIncrement();
            Vocabulary vocab = new Vocabulary();
            vocab.setLesson(lesson);
            vocab.setOrder(vocabOrder);
            vocab.setWord(vDto.getWord());
            vocab.setPinyin(vDto.getPinyin());
            vocab.setType(vDto.getType());
            vocab.setMeaning(vDto.getMeaning());
            vocab.setExample(exampleLine);
            if (audioRootPublicId != null && lessonDto.getOrder() != null) {
               String pid = String.format("%s/lesson-%d_vocab-%d", audioRootPublicId,
                     lessonDto.getOrder(), vocabOrder);
               vocab.setAudioPublicId(pid);
            }
            vocabularyRepository.save(vocab);

         }
      }

      return lesson;
   }

   public Curriculum getOrCreateCurriculumFromMetadata(CurriculumMetadataDto metadata) {
      try {
         if (metadata == null)
            return null;

         // Bắt buộc phải có order và name
         if (metadata.getOrder() == null || !StringUtils.hasText(metadata.getName())) {
            log.warn("Curriculum metadata missing required fields 'order' or 'name'. Skipping.");
            return null;
         }

         return curriculumRepository.findByOrder(metadata.getOrder()).map(c -> {
            c.setDescription(metadata.getDescription());
            c.setLevel(metadata.getLevel());
            c.setName(metadata.getName());
            return curriculumRepository.save(c);
         }).orElseGet(() -> {
            return curriculumRepository.save(Curriculum.builder()
                  .order(metadata.getOrder())
                  .name(metadata.getName())
                  .description(metadata.getDescription())
                  .level(metadata.getLevel())
                  .build());
         });

      } catch (Exception e) {
         log.error("Failed to upsert curriculum from metadata", e);
         return null;
      }
   }

   public Set<String> getAllConversationLines(Long lessonId) {
      Set<String> conversationLines = new HashSet<>();
      List<Conversation> conversationList = conversationRepository.findByLessonIdOrderByOrder(lessonId);
      for (Conversation conversation : conversationList) {
         List<ConversationLine> lines = conversationLineRepository
               .findByConversationIdOrderByOrder(conversation.getId());
         for (ConversationLine conversationLine : lines) {
            conversationLines.add(conversationLine.getZhText());
         }
      }
      return conversationLines;
   }

   /**
    * Collects all conversation lines across all lessons/conversations.
    * Used to support "daily mixed" practice which pulls sentences from the whole
    * curriculum.
    */
   public Set<String> getAllConversationLines() {
      Set<String> conversationLines = new HashSet<>();
      List<Conversation> allConversations = conversationRepository.findAll();
      for (Conversation conversation : allConversations) {
         List<ConversationLine> lines = conversationLineRepository
               .findByConversationIdOrderByOrder(conversation.getId());
         for (ConversationLine conversationLine : lines) {
            conversationLines.add(conversationLine.getZhText());
         }
      }
      return conversationLines;
   }
}