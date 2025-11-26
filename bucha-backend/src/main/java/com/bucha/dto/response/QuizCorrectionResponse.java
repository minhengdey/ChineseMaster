package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizCorrectionResponse {
    Long questionId;
    String yourAnswer;
    String correctAnswer;
    Boolean correct;
}
