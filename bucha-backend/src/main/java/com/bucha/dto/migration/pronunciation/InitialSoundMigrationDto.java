package com.bucha.dto.migration.pronunciation;

import lombok.Data;

@Data
public class InitialSoundMigrationDto {
   private Long id;
   private String type;
   private String text;
   private String ipa;
   private String pronunciation;
}
