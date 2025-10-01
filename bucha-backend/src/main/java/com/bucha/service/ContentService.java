package com.bucha.service;

import com.bucha.dto.content.*;
import com.bucha.entity.*;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContentService {

   private final CurriculumRepository curriculumRepository;
   private final LessonRepository lessonRepository;
   private final ModelMapper modelMapper;

   // Curriculum methods
   public List<CurriculumDto> getAllCurriculums() {
      return curriculumRepository.findAll().stream()
            .map(curriculum -> modelMapper.map(curriculum, CurriculumDto.class))
            .collect(Collectors.toList());
   }

   public CurriculumDetailDto getCurriculumById(Long id) {
      Curriculum curriculum = curriculumRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Curriculum not found with id: " + id));
      return modelMapper.map(curriculum, CurriculumDetailDto.class);
   }

   // Lesson methods
   public List<LessonDto> getLessonsByCurriculumId(Long curriculumId) {
      return lessonRepository.findByCurriculumIdOrderByOrder(curriculumId).stream()
            .map(lesson -> modelMapper.map(lesson, LessonDto.class))
            .collect(Collectors.toList());
   }

   public LessonDetailDto getLessonById(Long id) {
      Lesson lesson = lessonRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
      return mapToLessonDetailDto(lesson);
   }

   // Helper mapping methods
   private LessonDetailDto mapToLessonDetailDto(Lesson lesson) {
      LessonDetailDto dto = modelMapper.map(lesson, LessonDetailDto.class);

      // Map conversations
      dto.setConversations(lesson.getConversations().stream()
            .map(this::mapToConversationDto)
            .collect(Collectors.toList()));

      // Map vocabularies
      dto.setVocabularies(lesson.getVocabularies().stream()
            .map(this::mapToVocabularyDto)
            .collect(Collectors.toList()));

      return dto;
   }

   private ConversationDto mapToConversationDto(Conversation conversation) {
      ConversationDto dto = modelMapper.map(conversation, ConversationDto.class);
      dto.setLines(conversation.getLines().stream()
            .map(line -> modelMapper.map(line, ConversationLineDto.class))
            .collect(Collectors.toList()));
      return dto;
   }

   private VocabularyDto mapToVocabularyDto(Vocabulary vocabulary) {
      return modelMapper.map(vocabulary, VocabularyDto.class);
   }
}