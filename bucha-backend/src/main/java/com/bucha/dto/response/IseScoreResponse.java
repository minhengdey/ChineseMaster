package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IseScoreResponse {
    Long id;
    Double totalScore;
    Double accuracy;
    Double fluency;
    Double completeness;
    Double durationSeconds;
    Integer numSentences;
    Integer numWrongWords;
    String scoreCategory;
    Long lessonId;
    Long lineId;
    Long vocabularyId;
    Long testId;
    Boolean includeInDaily;
    LocalDateTime createdAt;
    LocalDateTime sessionDate;
    UserResponse user;
}
