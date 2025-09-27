package com.bucha.dto.content;

import lombok.Data;

@Data
public class AudioAssetDto {
    private Long id;
    private String filename;
    private String audioPath;
    private String audioType;
    private String mimeType;
    private Long duration;
}