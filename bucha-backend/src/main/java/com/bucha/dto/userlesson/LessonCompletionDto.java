package com.bucha.dto.userlesson;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonCompletionDto {
    private boolean completed;
    private long userDistinctLineCount;
    private long userDistinctVocabCount;
    private long totalLines;
    private long totalVocab;
}
