package com.bucha.dto.request;

import com.bucha.dto.response.IseScoreResponse;
import com.bucha.dto.response.UserLessonResponse;
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
public class RegisterRequest {
    String name;
    String email;
    String password;
    Integer xp;
    Integer steak;
    Boolean darkMode;
    Set<String> badges;
    LocalDateTime createdAt;
    List<IseScoreResponse> iseScores;
    List<UserLessonResponse> userLessons;
}
