package com.bucha.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MigrationPreviewDto {

   private boolean valid;
   private String curriculumName;
   private List<String> errors = new ArrayList<>();
   private List<String> warnings = new ArrayList<>();
   private MigrationStats stats;
   private List<LessonPreview> lessons = new ArrayList<>();

   @Data
   @AllArgsConstructor
   @NoArgsConstructor
   public static class MigrationStats {
      private int totalFiles;
      private int validFiles;
      private int invalidFiles;
      private int totalLessons;
      private int totalConversations;
      private int totalConversationLines;
      private int totalVocabulary;
   }

   @Data
   @AllArgsConstructor
   @NoArgsConstructor
   public static class LessonPreview {
      private String fileName;
      private String title;
      private boolean valid;
      private List<String> errors = new ArrayList<>();
      private List<String> warnings = new ArrayList<>();
      private int conversationCount;
      private int vocabularyCount;
      private int totalLines;
      private List<ConversationPreview> conversations = new ArrayList<>();
      private List<VocabularyPreview> vocabulary = new ArrayList<>();

      @Data
      @AllArgsConstructor
      @NoArgsConstructor
      public static class ConversationPreview {
         private String section;
         private String vnTranslation;
         private int lineCount;
         private List<String> speakers = new ArrayList<>();
      }

      @Data
      @AllArgsConstructor
      @NoArgsConstructor
      public static class VocabularyPreview {
         private String word;
         private String pinyin;
         private String type;
         private String meaning;
      }
   }
}