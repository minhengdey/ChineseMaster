package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationLineResponse {
    Long id;
    Long externalId;
    Integer order;
    String speaker;
    String zh;
    String pinyin;
    String vn;
    String audioPublicId;
    String audioUrl;
}
