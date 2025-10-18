package com.bucha.dto.migration.pronunciation;

import lombok.Data;

@Data
public class InitialSoundDto {
   private Long id;
   private String type;
   private String initial;
   private String ipa;
   private String pronunciation;
}
