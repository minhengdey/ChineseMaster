package com.bucha.dto.content;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

@Data
public class LineDto {
   private Long id;
   @JsonSerialize(using = ToStringSerializer.class)
   private Long externalId;
   private String zh; // Chinese text
   private String pinyin; // Pinyin pronunciation
   private String vn; // Vietnamese translation
   private String audioUrl; // URL to the audio file
   private String audioPublicId; // Cloudinary public_id for the audio
}
