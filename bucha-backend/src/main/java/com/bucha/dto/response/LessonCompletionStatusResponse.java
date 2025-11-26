package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonCompletionStatusResponse {
    Boolean completed;
    Long userDistinctLineCount;
    Long userDistinctVocabCount;
    Long totalLines;
    Long totalVocab;
}
