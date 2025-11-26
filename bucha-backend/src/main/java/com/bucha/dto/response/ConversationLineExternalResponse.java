package com.bucha.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationLineExternalResponse {
    Long id;
    @JsonSerialize(using = ToStringSerializer.class)
    Long externalId;
    Long conversationId;
    String zh;
    String pinyin;
}
