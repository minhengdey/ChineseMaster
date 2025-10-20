package com.bucha.dto.content;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

@Data
public class ConversationLineExternalDto {
    private Long id;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long externalId;
    private Long conversationId;
    private String zh;
    private String pinyin;
}
