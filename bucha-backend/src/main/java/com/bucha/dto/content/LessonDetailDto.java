package com.bucha.dto.content;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class LessonDetailDto extends LessonDto {
    private List<ConversationDto> conversations;
    private List<VocabularyDto> vocabularies;
}