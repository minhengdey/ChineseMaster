package com.bucha.dto.migration.pronunciation;

import lombok.Data;

@Data
public class FinalSoundMigrationDto {
   private Long id;
   private String category;
   private String text;
   private String ipa;
   private String pronunciation;
}
