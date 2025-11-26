package com.bucha.mapper;

import com.bucha.entity.Lesson;
import com.bucha.dto.response.LessonSummaryResponse;
import com.bucha.dto.response.LessonDetailResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LessonMapper {
    LessonSummaryResponse toSummary(Lesson lesson);

    @Mapping(target = "order", ignore = true)
    @Mapping(target = "conversations", ignore = true)
    @Mapping(target = "vocabularies", ignore = true)
    LessonDetailResponse toDetail(Lesson lesson);
}
