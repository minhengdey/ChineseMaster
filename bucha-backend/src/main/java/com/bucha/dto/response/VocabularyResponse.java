package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyResponse {
    Long id;
    Long externalId;
    String contentHash;
    String word;
    String pinyin;
    String type;
    String meaning;
    LessonResponse lesson;
    Integer order;
    String audioPublicId;
    String audioUrl;
    LineResponse example;
}
