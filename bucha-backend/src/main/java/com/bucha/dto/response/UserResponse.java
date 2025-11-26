package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long id;
    String name;
    String email;
    Integer xp;
    Integer streak;
    Boolean darkMode;
    Set<String> badges;
    LocalDateTime createdAt;
    List<IseScoreResponse> iseScores;
    List<UserLessonResponse> userLessons;
}
