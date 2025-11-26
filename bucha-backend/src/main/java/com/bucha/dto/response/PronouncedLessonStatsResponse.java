package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PronouncedLessonStatsResponse {
    List<String> lineIds;
    List<String> vocabularyIds;
    Integer distinctLineCount;
    Integer distinctVocabularyCount;
    Integer pronouncedCount;
    Double avgWordScore;
    Double avgSentenceScore;
}
