package com.bucha.mapper;

import com.bucha.dto.response.UserLessonResponse;
import com.bucha.entity.UserLesson;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", uses = { UserMapper.class,
        ContentMapper.class }, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserLessonMapper {
    UserLessonResponse toResponse(UserLesson userLesson);
}
