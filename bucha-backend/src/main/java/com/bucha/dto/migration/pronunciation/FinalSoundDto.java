package com.bucha.dto.migration.pronunciation;

import lombok.Data;

@Data
public class FinalSoundDto {
   private Long id;
   private String category;
   private String finalText;
   private String ipa;
   private String pronunciation;
}
