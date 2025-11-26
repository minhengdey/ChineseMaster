package com.bucha.mapper;

import com.bucha.dto.response.*;
import com.bucha.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", uses = {
        LessonMapper.class }, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ContentMapper {
    @Mapping(target = "audioUrl", ignore = true)
    @Mapping(target = "lines", ignore = true)
    ConversationResponse toConversation(Conversation conversation);

    @Mapping(target = "audioUrl", ignore = true)
    @Mapping(source = "zhText", target = "zh")
    @Mapping(source = "vnTranslation", target = "vn")
    ConversationLineResponse toConversationLine(ConversationLine line);

    @Mapping(target = "audioUrl", ignore = true)
    LineResponse toLine(Line line);

    @Mapping(target = "audioUrl", ignore = true)
    VocabularyResponse toVocabulary(Vocabulary vocabulary);

    LessonResponse toLesson(Lesson lesson);

    CurriculumResponse toCurriculum(Curriculum curriculum);

    @Mapping(target = "lessons", ignore = true)
    CurriculumDetailResponse toCurriculumDetail(Curriculum curriculum);
}
