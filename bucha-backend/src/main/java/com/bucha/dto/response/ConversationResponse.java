package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationResponse {
    Long id;
    Integer order;
    String section;
    String vnTranslation;
    String audioPublicId;
    String audioUrl;
    List<ConversationLineResponse> lines;
}
