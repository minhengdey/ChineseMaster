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

import java.util.Arrays;
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

      if (lessonDto.getConversations() != null) {
         for (ConversationMigrationDTO convDto : lessonDto.getConversations()) {
            int convOrder = convDto.getOrder();

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

            if (convDto.getLines() != null) {
               for (LineMigrationDTO lineDto : convDto.getLines()) {
                  int lineOrder = lineDto.getOrder();

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
                              lessonDto.getOrder(), vDto.getOrder());
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
                           lessonDto.getOrder(), vDto.getOrder());
                     exampleLine.setAudioPublicId(pid);
                  }
                  exampleLine.setExternalId(vDto.getExample().getId());
                  exampleLine.setContentHash(exampleHash);
                  exampleLine = lineRepository.save(exampleLine);
               }
            }

            int vocabOrder = vDto.getOrder();

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
         int toneIdx = 1;
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
                  existing.setOrder(toneIdx);
                  existing.setContentHash(hash);
                  toneRepository.save(existing);
               }
            } else {
               com.bucha.entity.Tone ent = new com.bucha.entity.Tone();
               ent.setName(dto.getName());
               ent.setToneMark(dto.getTone_mark());
               ent.setPitchValue(dto.getPitch_value());
               ent.setPronunciation(dto.getPronunciation());
               ent.setOrder(toneIdx);
               if (dto.getId() != null)
                  ent.setExternalId(dto.getId());
               ent.setContentHash(hash);
               toneRepository.save(ent);
            }
            toneIdx++;
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
         log.info("Upserting curriculum from metadata: {} {}", metadata.getName(), metadata.getId());
         Curriculum curriculum = null;
         if (metadata.getId() != null) {
            curriculum = curriculumRepository.findByExternalId(metadata.getId()).orElse(null);
         }
         if (curriculum != null) {
            curriculum.setDescription(metadata.getDescription());
            curriculum.setLevel(metadata.getLevel());
            curriculum.setName(metadata.getName());
            return curriculumRepository.save(curriculum);
         }
         return curriculumRepository.save(Curriculum.builder()
               .externalId(metadata.getId())
               .name(metadata.getName())
               .description(metadata.getDescription())
               .level(metadata.getLevel())
               .order(metadata.getOrder())
               .build());

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
}