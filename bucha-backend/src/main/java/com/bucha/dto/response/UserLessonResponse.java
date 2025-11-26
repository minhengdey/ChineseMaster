package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserLessonResponse {
    Long id;
    UserResponse user;
    LessonResponse lesson;
    Boolean completed;
    Boolean inProgress;
    LocalDateTime completedAt;
    LocalDateTime createdAt;
}
