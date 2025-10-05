package com.bucha.dto.migration;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LessonMigrationDTO {
   private Integer order;
   private String title;
   private List<ConversationMigrationDTO> conversations;
   private List<VocabularyMigrationDTO> vocabulary;
}
