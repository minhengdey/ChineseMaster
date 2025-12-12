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

    @NotNull
    Map<String, SectionResultDTO> sections;

    @NotNull
    Double totalScore;

    String timestamp;
    Integer durationSeconds;
}
