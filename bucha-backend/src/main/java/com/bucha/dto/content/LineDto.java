package com.bucha.dto.content;

import lombok.Data;

@Data
public class LineDto {
   private Long id;
   private String zhText; // Chinese text
   private String pinyin; // Pinyin pronunciation
   private String vnTranslation; // Vietnamese translation
   private String audioUrl; // URL to the audio file
   private String audioPublicId; // Cloudinary public_id for the audio
}
