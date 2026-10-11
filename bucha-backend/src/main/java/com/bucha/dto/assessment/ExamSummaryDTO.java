package com.bucha.dto.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamSummaryDTO {
    String id;
    String title;
    Integer questionCount;
    Boolean completed;
    Double score;
}
