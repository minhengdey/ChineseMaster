package com.bucha.mapper;

import com.bucha.dto.userlesson.UserLessonDto;
import com.bucha.entity.UserLesson;
import org.springframework.stereotype.Component;

@Component
public class UserLessonMapper {

    public UserLessonDto toDto(UserLesson entity) {
        if (entity == null) return null;
        return UserLessonDto.builder()
                .id(entity.getId())
                .lessonId(entity.getLesson() != null ? entity.getLesson().getId() : null)
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .completed(entity.isCompleted())
                .inProgress(entity.isInProgress())
                .completedAt(entity.getCompletedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
