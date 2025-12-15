package com.bucha.dto.assessment;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitExamRequest {
    @NotNull
    String assessmentId;

    Map<String, SectionResultDTO> sections;

    Double totalScore;

    String timestamp;
    Integer durationSeconds;

    // Per-item submission fields
    String section;
    Long itemId;
    String itemType;
    Double fluency;
    Double completeness;
    Double initialScore;
    Double finalScore;
    Double toneScore;
}
