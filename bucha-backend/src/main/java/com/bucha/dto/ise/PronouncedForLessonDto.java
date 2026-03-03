package com.bucha.dto.ise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PronouncedForLessonDto {
    private List<String> lineIds;
    private List<String> vocabularyIds;
    private int distinctLineCount;
    private int distinctVocabularyCount;
    private int pronouncedCount;
    private Double avgWordScore;
    private Double avgSentenceScore;
}
