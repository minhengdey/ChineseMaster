package com.bucha.dto.content;

import lombok.Data;
import java.util.List;

@Data
public class ConversationDto {
    private Long id;
    private String section;
    private String vnTranslation;
    private List<ConversationLineDto> lines;
}