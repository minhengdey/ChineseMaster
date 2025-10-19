package com.bucha.dto.content;

import lombok.Data;

@Data
public class VocabularyDto {
    private Long id;
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