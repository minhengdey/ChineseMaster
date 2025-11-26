package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardResponse {
    Long id;
    Long userId;
    String hanzi;
    String pinyin;
    String meaning;
    Integer intervalDays;
    Integer box;
    Double efactor;
    LocalDateTime nextReview;
}
