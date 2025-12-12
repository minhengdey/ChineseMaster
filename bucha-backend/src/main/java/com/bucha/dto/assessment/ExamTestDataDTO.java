package com.bucha.dto.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamTestDataDTO {
    List<QuestionDTO> thanhMau;
    List<QuestionDTO> vanMau;
    List<QuestionDTO> thanhDieu;
    List<QuestionDTO> sentences;
}
