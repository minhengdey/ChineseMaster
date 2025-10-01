package com.bucha.dto.content;

import lombok.Data;

@Data
public class ConversationLineDto {
    private Long id;
    private String speaker;
    private String zhText;
    private String pinyin;
    private String vnTranslation;
    private AudioAssetDto audioAsset;
}