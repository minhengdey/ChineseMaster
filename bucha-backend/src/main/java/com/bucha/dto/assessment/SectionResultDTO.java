package com.bucha.dto.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SectionResultDTO {
    String section;
    Double averageScore;
    List<ItemScoreDTO> items;
}
