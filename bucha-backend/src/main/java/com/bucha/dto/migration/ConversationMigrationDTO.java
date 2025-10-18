package com.bucha.dto.migration;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationMigrationDTO {
   private Long id;
   private String section;

   @JsonProperty("vn_translation")
   private String vnTranslation;

   private List<LineMigrationDTO> lines;
}
