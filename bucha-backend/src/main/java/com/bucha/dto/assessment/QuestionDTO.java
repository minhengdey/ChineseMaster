package com.bucha.dto.assessment;

import com.bucha.entity.Exam;
import com.bucha.entity.QuestionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuestionDTO {
    Long id;
    String externalId;
    QuestionType questionType;
    Integer order;
    String content;
    String audioPublicId;
    String audioUrl;
}
