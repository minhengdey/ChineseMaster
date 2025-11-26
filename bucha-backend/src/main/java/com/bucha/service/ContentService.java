package com.bucha.service;

import com.bucha.dto.response.CurriculumResponse;
import com.bucha.dto.response.CurriculumDetailResponse;
import com.bucha.dto.response.LessonResponse;
import com.bucha.dto.response.LessonDetailResponse;
import com.bucha.dto.response.ConversationResponse;
import com.bucha.dto.response.ConversationLineResponse;
import com.bucha.dto.response.VocabularyResponse;
import com.bucha.dto.response.LineResponse;
import com.bucha.dto.response.ConversationLineExternalResponse;
import com.bucha.entity.*;
import com.bucha.enums.ErrorCode;
import com.bucha.exception.AppException;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import com.bucha.mapper.ContentMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentService {
   private final CurriculumRepository curriculumRepository;
   private final LessonRepository lessonRepository;
   private final ConversationRepository conversationRepository;
   private final ConversationLineRepository conversationLineRepository;
   private final VocabularyRepository vocabularyRepository;
   private final CloudinaryService cloudinaryService;
   private final ContentMapper contentMapper;

   public List<CurriculumResponse> getAllCurriculums() {
      return curriculumRepository.findAll().stream().map(contentMapper::toCurriculum).collect(Collectors.toList());
   }

   public CurriculumDetailResponse getCurriculumById(Long id) {
      Curriculum c = curriculumRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.CURRICULUM_NOT_FOUND));
      List<LessonResponse> lessons = lessonRepository.findByCurriculumIdOrderByOrder(id).stream()
            .map(this::mapLesson)
            .collect(Collectors.toList());
      CurriculumDetailResponse dto = contentMapper.toCurriculumDetail(c);
      dto.setLessons(lessons);
      return dto;
   }

   public List<LessonResponse> getLessonsByCurriculumId(Long id) {
      return lessonRepository.findByCurriculumIdOrderByOrder(id).stream()
            .map(this::mapLesson)
            .collect(Collectors.toList());
   }

   public LessonDetailResponse getLessonById(Long id) {
      Lesson lesson = lessonRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
      return mapLessonDetail(lesson);
   }

   // Debug method: return conversation lines with externalId for a lesson
   public java.util.List<ConversationLineExternalResponse> getConversationLinesWithExternalForLesson(
         Long lessonId) {
      return conversationRepository.findByLessonIdOrderByOrder(lessonId).stream()
            .flatMap(conv -> conversationLineRepository.findByConversationIdOrderByOrder(conv.getId()).stream())
            .map(line -> {
               return ConversationLineExternalResponse.builder()
                     .id(line.getId())
                     .externalId(line.getExternalId())
                     .conversationId(line.getConversation() != null ? line.getConversation().getId() : null)
                     .zh(line.getZhText())
                     .pinyin(line.getPinyin())
                     .build();
            }).collect(java.util.stream.Collectors.toList());
   }

   private LessonResponse mapLesson(Lesson l) {
      return contentMapper.toLesson(l);
   }

   private LessonDetailResponse mapLessonDetail(Lesson l) {
      List<ConversationResponse> conversations = conversationRepository.findByLessonIdOrderByOrder(l.getId()).stream()
            .map(this::mapConversation)
            .collect(Collectors.toList());

      List<VocabularyResponse> vocabularies = vocabularyRepository.findByLessonIdOrderByOrder(l.getId()).stream()
            .map(this::mapVocabulary)
            .collect(Collectors.toList());

      return LessonDetailResponse.builder()
            .id(l.getId())
            .title(l.getTitle())
            .order(l.getOrder())
            .conversations(conversations)
            .vocabularies(vocabularies)
            .build();
   }

   private ConversationResponse mapConversation(Conversation c) {
      List<ConversationLineResponse> lines = conversationLineRepository.findByConversationIdOrderByOrder(c.getId())
            .stream().map(this::mapConversationLine).collect(Collectors.toList());
      ConversationResponse dto = contentMapper.toConversation(c);
      dto.setLines(lines);
      if (c.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(c.getAudioPublicId()));
      }
      return dto;
   }

   private ConversationLineResponse mapConversationLine(ConversationLine line) {
      ConversationLineResponse dto = contentMapper.toConversationLine(line);
      if (line.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(line.getAudioPublicId()));
      }
      return dto;
   }

   private VocabularyResponse mapVocabulary(Vocabulary v) {
      VocabularyResponse dto = contentMapper.toVocabulary(v);
      // map example line and audio urls
      if (v.getExample() != null) {
         LineResponse ex = contentMapper.toLine(v.getExample());
         if (v.getExample().getAudioPublicId() != null) {
            ex.setAudioUrl(cloudinaryService.getAudioUrl(v.getExample().getAudioPublicId()));
         }
         dto.setExample(ex);
      }
      if (v.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(v.getAudioPublicId()));
      }
      return dto;
   }

   // Line mapping handled via ContentMapper; audioUrl set where needed
}
