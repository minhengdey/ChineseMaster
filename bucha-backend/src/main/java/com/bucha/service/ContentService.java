package com.bucha.service;

import com.bucha.dto.content.*;
import com.bucha.entity.*;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
      return curriculumRepository.findAll().stream()
            .map(this::mapCurriculumToDto)
            .collect(Collectors.toList());
   }

   /** Curriculums with lesson count in 2 queries (no N+1). */
   public List<CurriculumDto> getCurriculumsWithLessonCount() {
      List<Curriculum> list = curriculumRepository.findAll();
      if (list.isEmpty())
         return List.of();
      List<Object[]> counts = lessonRepository.countGroupByCurriculumId();
      Map<Long, Long> countByCurriculumId = counts.stream()
            .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
      return list.stream()
            .map(c -> {
               CurriculumDto dto = mapCurriculumToDto(c);
               dto.setLessonCount(countByCurriculumId.getOrDefault(c.getId(), 0L).intValue());
               return dto;
            })
            .collect(Collectors.toList());
   }

   private CurriculumDto mapCurriculumToDto(Curriculum c) {
      CurriculumDto dto = new CurriculumDto();
      dto.setId(c.getId());
      dto.setName(c.getName());
      dto.setDescription(c.getDescription());
      dto.setLevel(c.getLevel());
      return dto;
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

   public List<LessonDetailDto> getLessonsByIds(List<Long> ids) {
      if (ids == null || ids.isEmpty())
         return List.of();
      List<Lesson> lessons = lessonRepository.findAllById(ids);
      return buildLessonDetailsBatch(lessons);
   }

   /**
    * Returns a page of lesson details, ordered by curriculum id then lesson order.
    * Uses batch queries to avoid N+1 (1 lesson page + 1 conversations + 1 vocabularies + 1 lines).
    */
   /**
    * Search vocabulary by word, pinyin, meaning, or example text. Returns items with lesson context.
    * Minimum query length 2; empty page if query is too short.
    */
   public Page<VocabularySearchItemDto> searchVocabulary(String q, int page, int size) {
      String trimmed = q != null ? q.trim() : "";
      if (trimmed.length() < 2) {
         return new org.springframework.data.domain.PageImpl<>(
            List.of(),
            PageRequest.of(page, size),
            0L);
      }
      Pageable pageable = PageRequest.of(page, size, Sort.by("id"));
      Page<Vocabulary> vocabPage = vocabularyRepository.searchByQuery(trimmed, pageable);
      List<VocabularySearchItemDto> content = vocabPage.getContent().stream()
            .map(this::mapVocabularyToSearchItem)
            .collect(Collectors.toList());
      return new org.springframework.data.domain.PageImpl<>(
            content,
            vocabPage.getPageable(),
            vocabPage.getTotalElements());
   }

   private VocabularySearchItemDto mapVocabularyToSearchItem(Vocabulary v) {
      VocabularySearchItemDto dto = new VocabularySearchItemDto();
      dto.setId(v.getId());
      dto.setExternalId(v.getExternalId());
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
      Lesson lesson = v.getLesson();
      if (lesson != null) {
         dto.setLessonId(lesson.getId());
         dto.setLessonTitle(lesson.getTitle());
         dto.setCurriculumId(lesson.getCurriculum() != null ? lesson.getCurriculum().getId() : null);
      }
      return dto;
   }

   public Page<LessonDetailDto> getLessonsPage(int page, int size) {
      Pageable pageable = PageRequest.of(page, size,
            Sort.by(Sort.Order.asc("curriculum.id").with(Sort.NullHandling.NULLS_LAST),
                  Sort.Order.asc("order")));
      Page<Lesson> lessonPage = lessonRepository.findAll(pageable);
      List<Lesson> lessons = lessonPage.getContent();
      List<LessonDetailDto> content = lessons.isEmpty()
            ? List.of()
            : buildLessonDetailsBatch(lessons);
      return new org.springframework.data.domain.PageImpl<>(content, pageable, lessonPage.getTotalElements());
   }

   /**
    * Batch load conversations, vocabularies, lines for the given lessons (4 queries total).
    */
   private List<LessonDetailDto> buildLessonDetailsBatch(List<Lesson> lessons) {
      if (lessons.isEmpty())
         return List.of();
      List<Long> lessonIds = lessons.stream().map(Lesson::getId).filter(Objects::nonNull).toList();
      if (lessonIds.isEmpty())
         return List.of();
      List<Conversation> conversations = conversationRepository.findByLesson_IdIn(lessonIds);
      List<Vocabulary> vocabularies = vocabularyRepository.findByLesson_IdInWithExample(lessonIds);
      vocabularies.sort(Comparator
            .comparingLong((Vocabulary v) -> v.getLesson() != null ? v.getLesson().getId() : 0L)
            .thenComparing(Vocabulary::getOrder, Comparator.nullsLast(Comparator.naturalOrder())));
      List<Long> conversationIds = conversations.stream().map(Conversation::getId).toList();
      List<ConversationLine> lines = conversationIds.isEmpty()
            ? List.of()
            : conversationLineRepository.findByConversation_IdIn(conversationIds);

      Map<Long, List<Conversation>> convByLesson = conversations.stream()
            .collect(Collectors.groupingBy(c -> c.getLesson() != null ? c.getLesson().getId() : 0L));
      Map<Long, List<Vocabulary>> vocabByLesson = vocabularies.stream()
            .collect(Collectors.groupingBy(v -> v.getLesson() != null ? v.getLesson().getId() : 0L));
      Map<Long, List<ConversationLine>> linesByConv = lines.stream()
            .collect(Collectors.groupingBy(l -> l.getConversation() != null ? l.getConversation().getId() : 0L));

      List<LessonDetailDto> result = new ArrayList<>(lessons.size());
      for (Lesson lesson : lessons) {
         Long lid = lesson.getId();
         LessonDetailDto dto = new LessonDetailDto();
         dto.setId(lid);
         dto.setTitle(lesson.getTitle());
         dto.setOrder(lesson.getOrder());
         dto.setConversations(mapConversationsFromBatch(convByLesson.getOrDefault(lid, List.of()), linesByConv));
         dto.setVocabularies(mapVocabulariesFromBatch(vocabByLesson.getOrDefault(lid, List.of())));
         result.add(dto);
      }
      return result;
   }

   private List<ConversationDto> mapConversationsFromBatch(List<Conversation> conversations,
         Map<Long, List<ConversationLine>> linesByConv) {
      return conversations.stream()
            .map(c -> mapConversationFromBatch(c, linesByConv.getOrDefault(c.getId(), List.of())))
            .collect(Collectors.toList());
   }

   private ConversationDto mapConversationFromBatch(Conversation c, List<ConversationLine> lines) {
      ConversationDto dto = new ConversationDto();
      dto.setId(c.getId());
      dto.setOrder(c.getOrder());
      dto.setSection(c.getSection());
      dto.setVnTranslation(c.getVnTranslation());
      dto.setAudioPublicId(c.getAudioPublicId());
      if (c.getAudioPublicId() != null)
         dto.setAudioUrl(cloudinaryService.getAudioUrl(c.getAudioPublicId()));
      dto.setLines(lines.stream().map(this::mapConversationLine).collect(Collectors.toList()));
      return dto;
   }

   private List<VocabularyDto> mapVocabulariesFromBatch(List<Vocabulary> vocabularies) {
      return vocabularies.stream().map(this::mapVocabulary).collect(Collectors.toList());
   }

   /** Debug: conversation lines with externalId for a lesson (single query). */
   public List<ConversationLineExternalDto> getConversationLinesWithExternalForLesson(Long lessonId) {
      return conversationLineRepository
            .findByConversation_Lesson_IdOrderByConversation_OrderAscOrderAsc(lessonId)
            .stream()
            .map(line -> {
               ConversationLineExternalDto d = new ConversationLineExternalDto();
               d.setId(line.getId());
               d.setExternalId(line.getExternalId());
               d.setConversationId(line.getConversation() != null ? line.getConversation().getId() : null);
               d.setZh(line.getZhText());
               d.setPinyin(line.getPinyin());
               return d;
            })
            .collect(Collectors.toList());
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
      // expose external identifier so frontend can reference content by stable
      // externalId
      dto.setExternalId(line.getExternalId());
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
      // expose external identifier if present
      dto.setExternalId(v.getExternalId());
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
      // expose external identifier for nested example lines as well
      dto.setExternalId(line.getExternalId());
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
