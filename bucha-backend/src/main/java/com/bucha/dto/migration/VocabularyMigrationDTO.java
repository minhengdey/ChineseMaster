package com.bucha.dto.migration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VocabularyMigrationDTO {
   private String word;
   private String pinyin;
   private String type;
   private String meaning;
   private LineMigrationDTO example;
}
