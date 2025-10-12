package com.bucha.service;

import com.bucha.dto.content.*;
import com.bucha.entity.*;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
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

   public List<CurriculumDto> getAllCurriculums() {
      return curriculumRepository.findAll().stream().map(c -> {
         CurriculumDto dto = new CurriculumDto();
         dto.setId(c.getId());
         dto.setName(c.getName());
         dto.setDescription(c.getDescription());
         dto.setLevel(c.getLevel());
         return dto;
      }).collect(Collectors.toList());
   }

   public CurriculumDetailDto getCurriculumById(Long id) {
      Curriculum c = curriculumRepository.findById(id).orElse(null);
      if (c == null)
         return null;
      CurriculumDetailDto dto = new CurriculumDetailDto();
      dto.setId(c.getId());
      dto.setName(c.getName());
      dto.setDescription(c.getDescription());
      dto.setLevel(c.getLevel());
      List<LessonDto> lessons = lessonRepository.findByCurriculumIdOrderByOrder(id).stream().map(this::mapLesson)
            .collect(Collectors.toList());
      dto.setLessons(lessons);
      return dto;
   }

   public List<LessonDto> getLessonsByCurriculumId(Long id) {
      return lessonRepository.findByCurriculumIdOrderByOrder(id).stream()
            .map(this::mapLesson)
            .collect(Collectors.toList());
   }

   public LessonDetailDto getLessonById(Long id) {
      Lesson lesson = lessonRepository.findById(id).orElse(null);
      if (lesson == null)
         return null;
      return mapLessonDetail(lesson);
   }

   private LessonDto mapLesson(Lesson l) {
      LessonDto dto = new LessonDto();
      dto.setId(l.getId());
      dto.setTitle(l.getTitle());
      dto.setOrder(l.getOrder());
      return dto;
   }

   private LessonDetailDto mapLessonDetail(Lesson l) {
      LessonDetailDto dto = new LessonDetailDto();
      dto.setId(l.getId());
      dto.setTitle(l.getTitle());
      dto.setOrder(l.getOrder());

      List<ConversationDto> conversations = conversationRepository.findByLessonIdOrderByOrder(l.getId()).stream()
            .map(this::mapConversation)
            .collect(Collectors.toList());
      dto.setConversations(conversations);

      List<VocabularyDto> vocabularies = vocabularyRepository.findByLessonIdOrderByOrder(l.getId()).stream()
            .map(this::mapVocabulary)
            .collect(Collectors.toList());
      dto.setVocabularies(vocabularies);

      return dto;
   }

   private ConversationDto mapConversation(Conversation c) {
      ConversationDto dto = new ConversationDto();
      dto.setId(c.getId());
      dto.setOrder(c.getOrder());
      dto.setSection(c.getSection());
      dto.setVnTranslation(c.getVnTranslation());
      dto.setAudioPublicId(c.getAudioPublicId());
      if (c.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(c.getAudioPublicId()));
      }
      List<ConversationLineDto> lines = conversationLineRepository.findByConversationIdOrderByOrder(c.getId())
            .stream().map(this::mapConversationLine).collect(Collectors.toList());
      dto.setLines(lines);
      return dto;
   }

   private ConversationLineDto mapConversationLine(ConversationLine line) {
      ConversationLineDto dto = new ConversationLineDto();
      dto.setId(line.getId());
      dto.setOrder(line.getOrder());
      dto.setSpeaker(line.getSpeaker());
      dto.setZh(line.getZhText());
      dto.setPinyin(line.getPinyin());
      dto.setVn(line.getVnTranslation());
      dto.setAudioPublicId(line.getAudioPublicId());
      if (line.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(line.getAudioPublicId()));
      }
      return dto;
   }

   private VocabularyDto mapVocabulary(Vocabulary v) {
      VocabularyDto dto = new VocabularyDto();
      dto.setId(v.getId());
      dto.setOrder(v.getOrder());
      dto.setWord(v.getWord());
      dto.setPinyin(v.getPinyin());
      dto.setType(v.getType());
      dto.setMeaning(v.getMeaning());
      dto.setAudioPublicId(v.getAudioPublicId());
      if (v.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(v.getAudioPublicId()));
      }
      dto.setExample(mapLine(v.getExample()));
      return dto;
   }

   private LineDto mapLine(Line line) {
      if (line == null)
         return null;
      LineDto dto = new LineDto();
      dto.setId(line.getId());
      dto.setZh(line.getZhText());
      dto.setPinyin(line.getPinyin());
      dto.setVn(line.getVnTranslation());
      dto.setAudioPublicId(line.getAudioPublicId());
      if (line.getAudioPublicId() != null) {
         dto.setAudioUrl(cloudinaryService.getAudioUrl(line.getAudioPublicId()));
      }
      return dto;
   }
}
