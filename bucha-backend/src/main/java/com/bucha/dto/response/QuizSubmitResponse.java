package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizSubmitResponse {
    Integer score;
    Integer total;
    List<QuizCorrectionResponse> corrections;
}
