package com.bucha.dto.content;

import lombok.Data;

@Data
public class VocabularyDto {
    private Long id;
    private String word;
    private String pinyin;
    private String type;
    private String meaning;
    private AudioAssetDto audioAsset;
}