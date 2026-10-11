package com.bucha.dto.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamDetailDTO {
    String id;
    String title;
    Boolean completed;
    Double score;
    ExamTestDataDTO testData;
    LastResultDTO lastResult;
}
