package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "conversation_lines")
@Builder
@AllArgsConstructor
public class ConversationLine {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(name = "external_id")
   private Long externalId;

   @Column(name = "content_hash", length = 64)
   private String contentHash;

   @Column(nullable = false)
   private String speaker; // e.g., "大卫", "李军", "王老师"

   @Column(name = "zh_text", nullable = false, length = 1000)
   private String zhText; // Chinese text

   @Column(nullable = false, length = 1000)
   private String pinyin; // Pinyin pronunciation

   @Column(name = "vn_translation", nullable = false, length = 1000)
   private String vnTranslation; // Vietnamese translation

   @Column()
   private String audioPublicId;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "conversation_id")
   private Conversation conversation;

   @Column(name = "line_order")
   private Integer order; // Thứ tự câu trong đoạn hội thoại

   // Constructors
   public ConversationLine() {
   }

   public ConversationLine(String speaker, String zhText, String pinyin, String vnTranslation,
         Conversation conversation, Integer order) {
      this.speaker = speaker;
      this.zhText = zhText;
      this.pinyin = pinyin;
      this.vnTranslation = vnTranslation;
      this.conversation = conversation;
      this.order = order;
   }
}