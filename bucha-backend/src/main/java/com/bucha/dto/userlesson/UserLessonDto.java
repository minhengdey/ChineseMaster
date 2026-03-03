package com.bucha.dto.userlesson;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLessonDto {
    private Long id;
    private Long lessonId;
    private Long userId;
    private boolean completed;
    private boolean inProgress;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
