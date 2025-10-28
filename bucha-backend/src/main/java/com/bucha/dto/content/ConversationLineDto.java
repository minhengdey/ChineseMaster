package com.bucha.dto.content;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

@Data
public class ConversationLineDto {
    private Long id;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long externalId;
    private Integer order;
    private String speaker;
    private String zh;
    private String pinyin;
    private String vn;
    private String audioPublicId;
    private String audioUrl;
}