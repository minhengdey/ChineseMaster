package com.bucha.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class LessonMigrationDto {

   private Integer order;
   private String title;

   private List<ConversationDto> conversations;

   private List<VocabularyDto> vocabulary;

   @Data
   public static class ConversationDto {
      private String section;

      @JsonProperty("vn_translation")
      private String vnTranslation;

      private List<LineDto> lines;

      @Data
      public static class LineDto {
         private String speaker;

         @JsonProperty("zh")
         private String zhText;

         private String pinyin;

         @JsonProperty("vn")
         private String vnTranslation;
      }
   }

   @Data
   public static class VocabularyDto {
      private String word;
      private String pinyin;
      private String type;
      private String meaning;
   }
}