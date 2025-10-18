package com.bucha.dto.migration.pronunciation;

import lombok.Data;

@Data
public class ToneDto {
   private Long id;
   private String name;
   private String tone_mark;
   private String pitch_value;
   private String pronunciation;
}
