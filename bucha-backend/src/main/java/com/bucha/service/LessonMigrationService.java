package com.bucha.service;

import com.bucha.dto.CurriculumMetadataDto;
import com.bucha.dto.migration.ConversationMigrationDTO;
import com.bucha.dto.migration.LessonMigrationDTO;
import com.bucha.dto.migration.LineMigrationDTO;
import com.bucha.dto.migration.VocabularyMigrationDTO;
import com.bucha.entity.*;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Objects;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

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

      // required order
      if (lessonDto.getOrder() == null) {
         log.warn("Skipping lesson DTO. Reason: Required field 'order' is missing.");
         return null;
      }

      // compute canonical hash for lesson DTO
      String lessonCanonical = canonicalizeJson(lessonDto);
      String lessonHash = computeSha256Hex(lessonCanonical);

      Lesson lesson = null;
      if (lessonDto.getId() != null) {
         lesson = lessonRepository.findByExternalId(lessonDto.getId()).orElse(null);
      }

      if (lesson != null) {
         // existing lesson: update if changed
         if (!Objects.equals(lesson.getContentHash(), lessonHash)) {
            lesson.setTitle(lessonDto.getTitle());
            lesson.setCurriculum(curriculum);
            lesson.setOrder(lessonDto.getOrder());
            lesson.setContentHash(lessonHash);
            lessonRepository.save(lesson);
            // clear children to re-import
            lesson.getConversations().clear();
            lesson.getVocabularies().clear();
         }
      } else {
         // find by curriculum+order fallback
         lesson = lessonRepository.findByCurriculumAndOrder(curriculum, lessonDto.getOrder()).orElse(new Lesson());
         lesson.setTitle(lessonDto.getTitle());
         lesson.setCurriculum(curriculum);
         lesson.setOrder(lessonDto.getOrder());
         lesson.setExternalId(lessonDto.getId());
         lesson.setContentHash(lessonHash);
         if (lesson.getId() != null) {
            lesson.getConversations().clear();
            lesson.getVocabularies().clear();
         }
         lesson = lessonRepository.save(lesson);
      }

      AtomicInteger convOrdinal = new AtomicInteger(1);
      if (lessonDto.getConversations() != null) {
         for (ConversationMigrationDTO convDto : lessonDto.getConversations()) {
            int convOrder = convOrdinal.getAndIncrement();

            String convCanonical = canonicalizeJson(convDto);
            String convHash = computeSha256Hex(convCanonical);

            Conversation conv = null;
            if (convDto.getId() != null) {
               conv = conversationRepository.findByExternalId(convDto.getId()).orElse(null);
            }

            if (conv != null) {
               if (!Objects.equals(conv.getContentHash(), convHash)) {
                  conv.setOrder(convOrder);
                  try {
                     conv.setSection(convDto.getSection());
                  } catch (Exception ignored) {
                  }
                  try {
                     conv.setVnTranslation(convDto.getVnTranslation());
                  } catch (Exception ignored) {
                  }
                  conv.setContentHash(convHash);
                  conversationRepository.save(conv);
               }
            } else {
               conv = new Conversation();
               conv.setOrder(convOrder);
               conv.setLesson(lesson);
               try {
                  conv.setSection(convDto.getSection());
               } catch (Exception ignored) {
               }
               try {
                  conv.setVnTranslation(convDto.getVnTranslation());
               } catch (Exception ignored) {
               }
               conv.setExternalId(convDto.getId());
               conv.setContentHash(convHash);
               conv = conversationRepository.save(conv);
            }

            AtomicInteger lineOrdinal = new AtomicInteger(1);
            if (convDto.getLines() != null) {
               for (LineMigrationDTO lineDto : convDto.getLines()) {
                  int lineOrder = lineOrdinal.getAndIncrement();

                  String lineCanonical = canonicalizeJson(lineDto);
                  String lineHash = computeSha256Hex(lineCanonical);

                  ConversationLine line = null;
                  if (lineDto.getId() != null) {
                     line = conversationLineRepository.findByExternalId(lineDto.getId()).orElse(null);
                  }

                  if (line != null) {
                     if (!Objects.equals(line.getContentHash(), lineHash)) {
                        line.setOrder(lineOrder);
                        line.setSpeaker(lineDto.getSpeaker());
                        line.setZhText(lineDto.getZh());
                        line.setPinyin(lineDto.getPinyin());
                        line.setVnTranslation(lineDto.getVn());
                        if (audioRootPublicId != null && lessonDto.getOrder() != null) {
                           String pid = String.format("%s/lesson-%d_conv-%d_line-%d", audioRootPublicId,
                                 lessonDto.getOrder(), convOrder, lineOrder);
                           line.setAudioPublicId(pid);
                        }
                        line.setContentHash(lineHash);
                        conversationLineRepository.save(line);
                     }
                  } else {
                     line = new ConversationLine();
                     line.setConversation(conv);
                     line.setOrder(lineOrder);
                     line.setSpeaker(lineDto.getSpeaker());
                     line.setZhText(lineDto.getZh());
                     line.setPinyin(lineDto.getPinyin());
                     line.setVnTranslation(lineDto.getVn());
                     if (audioRootPublicId != null && lessonDto.getOrder() != null) {
                        String pid = String.format("%s/lesson-%d_conv-%d_line-%d", audioRootPublicId,
                              lessonDto.getOrder(), convOrder, lineOrder);
                        line.setAudioPublicId(pid);
                     }
                     line.setExternalId(lineDto.getId());
                     line.setContentHash(lineHash);
                     conversationLineRepository.save(line);
                  }
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
               String exampleCanonical = canonicalizeJson(vDto.getExample());
               String exampleHash = computeSha256Hex(exampleCanonical);

               if (vDto.getExample().getId() != null) {
                  exampleLine = lineRepository.findByExternalId(vDto.getExample().getId()).orElse(null);
               }

               if (exampleLine != null) {
                  if (!Objects.equals(exampleLine.getContentHash(), exampleHash)) {
                     exampleLine.setZhText(vDto.getExample().getZh());
                     exampleLine.setPinyin(vDto.getExample().getPinyin());
                     exampleLine.setVnTranslation(vDto.getExample().getVn());
                     if (audioRootPublicId != null && lessonDto.getOrder() != null) {
                        String pid = String.format("%s/lesson-%d_vocab-%d_example", audioRootPublicId,
                              lessonDto.getOrder(), vocabOrdinal.get());
                        exampleLine.setAudioPublicId(pid);
                     }
                     exampleLine.setContentHash(exampleHash);
                     lineRepository.save(exampleLine);
                  }
               } else {
                  exampleLine = new Line();
                  exampleLine.setZhText(vDto.getExample().getZh());
                  exampleLine.setPinyin(vDto.getExample().getPinyin());
                  exampleLine.setVnTranslation(vDto.getExample().getVn());
                  if (audioRootPublicId != null && lessonDto.getOrder() != null) {
                     String pid = String.format("%s/lesson-%d_vocab-%d_example", audioRootPublicId,
                           lessonDto.getOrder(), vocabOrdinal.get());
                     exampleLine.setAudioPublicId(pid);
                  }
                  exampleLine.setExternalId(vDto.getExample().getId());
                  exampleLine.setContentHash(exampleHash);
                  exampleLine = lineRepository.save(exampleLine);
               }
            }

            int vocabOrder = vocabOrdinal.getAndIncrement();

            String vocabCanonical = canonicalizeJson(vDto);
            String vocabHash = computeSha256Hex(vocabCanonical);

            Vocabulary vocab = null;
            if (vDto.getId() != null) {
               vocab = vocabularyRepository.findByExternalId(vDto.getId()).orElse(null);
            }

            if (vocab != null) {
               if (!Objects.equals(vocab.getContentHash(), vocabHash)) {
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
                  vocab.setContentHash(vocabHash);
                  vocabularyRepository.save(vocab);
               }
            } else {
               vocab = new Vocabulary();
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
               vocab.setExternalId(vDto.getId());
               vocab.setContentHash(vocabHash);
               vocabularyRepository.save(vocab);
            }

         }
      }

      return lesson;
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