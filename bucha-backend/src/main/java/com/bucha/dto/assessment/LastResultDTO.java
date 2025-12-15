package com.bucha.dto.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LastResultDTO {
    Map<String, SectionResultDTO> sections;
    Double totalScore;
}
