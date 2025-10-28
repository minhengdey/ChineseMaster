package com.bucha.dto.pronunciation;

import lombok.Data;

@Data
public class PronunciationGuideDto {
   private String type; // initial | final | tone
   private String key; // the symbol (e.g. 'b', 'ang', '3')
   private String ipa;
   private String pronunciation;
}
