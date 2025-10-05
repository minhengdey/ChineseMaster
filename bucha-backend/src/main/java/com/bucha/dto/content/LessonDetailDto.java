package com.bucha.dto.content;

import lombok.Data;

import java.util.List;

@Data
public class LessonDetailDto extends LessonDto {
    private List<ConversationDto> conversations;
    private List<VocabularyDto> vocabularies;
}