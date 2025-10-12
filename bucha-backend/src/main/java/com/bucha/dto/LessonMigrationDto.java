// package com.bucha.dto;

// import com.fasterxml.jackson.annotation.JsonProperty;

// import lombok.AllArgsConstructor;
// import lombok.Builder;
// import lombok.Data;

// import java.util.List;

// @Data
// @Builder
// @AllArgsConstructor
// public class LessonMigrationDto {

// private Integer order;
// private String title;

// private List<ConversationDto> conversations;

// private List<VocabularyDto> vocabulary;

// @Data
// public static class ConversationDto {
// private String section;

// @JsonProperty("vn_translation")
// private String vnTranslation;

// private List<LineDto> lines;

// @Data
// public static class LineDto {
// private String speaker;

// @JsonProperty("zh")
// private String zhText;

// private String pinyin;

// @JsonProperty("vn")
// private String vnTranslation;

// // Optional audio descriptor for this line
// @JsonProperty("audio")
// private AudioDto audio;
// }
// }

// @Data
// public static class VocabularyDto {
// private String word;
// private String pinyin;
// private String type;
// private String meaning;

// // Optional audio descriptor for this vocabulary entry
// @JsonProperty("audio")
// private AudioDto audio;
// }

// @Data
// public static class AudioDto {
// // Single enforced flow: use Cloudinary public_id (or alias 'path').
// // Any 'type' or 'url' fields in existing JSON will be ignored by migration.
// private String type; // ignored
// private String url; // ignored

// // Cloudinary identifier; JSON may use either "public_id" or "path"
// @JsonProperty("public_id")
// private String publicId;

// @JsonProperty("path")
// private String path;

// // Optional metadata
// @JsonProperty("mime_type")
// private String mimeType;

// // Duration in milliseconds (optional)
// private Long duration;
// }
// }