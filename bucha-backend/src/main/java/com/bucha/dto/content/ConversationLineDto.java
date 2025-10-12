package com.bucha.dto.content;

import lombok.Data;

@Data
public class ConversationLineDto {
    private Long id;
    private Integer order;
    private String speaker;
    private String zh;
    private String pinyin;
    private String vn;
    private String audioPublicId;
    private String audioUrl;
}