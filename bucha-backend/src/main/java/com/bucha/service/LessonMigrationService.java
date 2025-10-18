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
import java.util.Objects;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.bucha.dto.migration.pronunciation.PronunciationDto;
import com.bucha.dto.migration.pronunciation.InitialSoundMigrationDto;
import com.bucha.dto.migration.pronunciation.FinalSoundMigrationDto;
import com.bucha.dto.migration.pronunciation.ToneMigrationDto;
import com.bucha.repository.InitialSoundRepository;
import com.bucha.repository.FinalSoundRepository;
import com.bucha.repository.ToneRepository;

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
   private final InitialSoundRepository initialSoundRepository;
   private final FinalSoundRepository finalSoundRepository;
   private final ToneRepository toneRepository;

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

   @Transactional
   public void migratePronunciation(PronunciationDto pDto) {
      if (pDto == null)
         return;

      // Initials
      if (pDto.getInitials() != null) {
         for (InitialSoundMigrationDto dto : pDto.getInitials()) {
            String canonical = canonicalizeJson(dto);
            String hash = computeSha256Hex(canonical);

            com.bucha.entity.InitialSound existing = null;
            if (dto.getId() != null) {
               existing = initialSoundRepository.findByExternalId(dto.getId()).orElse(null);
            }

            if (existing != null) {
               if (!Objects.equals(existing.getContentHash(), hash)) {
                  existing.setType(dto.getType());
                  existing.setText(dto.getText());
                  existing.setIpa(dto.getIpa());
                  existing.setPronunciation(dto.getPronunciation());
                  existing.setContentHash(hash);
                  initialSoundRepository.save(existing);
               }
            } else {
               com.bucha.entity.InitialSound ent = new com.bucha.entity.InitialSound();
               ent.setType(dto.getType());
               ent.setText(dto.getText());
               ent.setIpa(dto.getIpa());
               ent.setPronunciation(dto.getPronunciation());
               if (dto.getId() != null)
                  ent.setExternalId(dto.getId());
               ent.setContentHash(hash);
               initialSoundRepository.save(ent);
            }
         }
      }

      // Finals
      if (pDto.getFinals() != null) {
         for (FinalSoundMigrationDto dto : pDto.getFinals()) {
            String canonical = canonicalizeJson(dto);
            String hash = computeSha256Hex(canonical);

            com.bucha.entity.FinalSound existing = null;
            if (dto.getId() != null) {
               existing = finalSoundRepository.findByExternalId(dto.getId()).orElse(null);
            }

            if (existing != null) {
               if (!Objects.equals(existing.getContentHash(), hash)) {
                  existing.setCategory(dto.getCategory());
                  existing.setText(dto.getText());
                  existing.setIpa(dto.getIpa());
                  existing.setPronunciation(dto.getPronunciation());
                  existing.setContentHash(hash);
                  finalSoundRepository.save(existing);
               }
            } else {
               com.bucha.entity.FinalSound ent = new com.bucha.entity.FinalSound();
               ent.setCategory(dto.getCategory());
               ent.setText(dto.getText());
               ent.setIpa(dto.getIpa());
               ent.setPronunciation(dto.getPronunciation());
               if (dto.getId() != null)
                  ent.setExternalId(dto.getId());
               ent.setContentHash(hash);
               finalSoundRepository.save(ent);
            }
         }
      }

      // Tones
      if (pDto.getTones() != null) {
         for (ToneMigrationDto dto : pDto.getTones()) {
            String canonical = canonicalizeJson(dto);
            String hash = computeSha256Hex(canonical);

            com.bucha.entity.Tone existing = null;
            if (dto.getId() != null) {
               existing = toneRepository.findByExternalId(dto.getId()).orElse(null);
            }

            if (existing != null) {
               if (!Objects.equals(existing.getContentHash(), hash)) {
                  existing.setName(dto.getName());
                  existing.setToneMark(dto.getTone_mark());
                  existing.setPitchValue(dto.getPitch_value());
                  existing.setPronunciation(dto.getPronunciation());
                  existing.setContentHash(hash);
                  toneRepository.save(existing);
               }
            } else {
               com.bucha.entity.Tone ent = new com.bucha.entity.Tone();
               ent.setName(dto.getName());
               ent.setToneMark(dto.getTone_mark());
               ent.setPitchValue(dto.getPitch_value());
               ent.setPronunciation(dto.getPronunciation());
               if (dto.getId() != null)
                  ent.setExternalId(dto.getId());
               ent.setContentHash(hash);
               toneRepository.save(ent);
            }
         }
      }
   }

   private String canonicalizeJson(Object obj) {
      try {
         ObjectMapper mapper = new ObjectMapper();
         mapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
         return mapper.writeValueAsString(obj);
      } catch (JsonProcessingException e) {
         throw new RuntimeException(e);
      }
   }

   private String computeSha256Hex(String input) {
      try {
         MessageDigest digest = MessageDigest.getInstance("SHA-256");
         byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
         StringBuilder hexString = new StringBuilder(2 * hash.length);
         for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1)
               hexString.append('0');
            hexString.append(hex);
         }
         return hexString.toString();
      } catch (NoSuchAlgorithmException e) {
         throw new RuntimeException(e);
      }
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