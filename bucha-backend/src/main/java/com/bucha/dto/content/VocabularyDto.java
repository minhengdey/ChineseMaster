package com.bucha.dto.content;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

@Data
public class VocabularyDto {
    private Long id;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long externalId;
    private Integer order;
    private String word;
    private String pinyin;
    private String type;
    private String meaning;
    private String audioPublicId;
    private String audioUrl;
    private LineDto example;
}