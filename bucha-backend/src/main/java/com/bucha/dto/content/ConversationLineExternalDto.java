package com.bucha.dto.content;

import lombok.Data;

@Data
public class ConversationLineExternalDto {
    private Long id;
    private Long externalId;
    private Long conversationId;
    private String zh;
    private String pinyin;
}
