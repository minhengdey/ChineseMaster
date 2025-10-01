package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "conversation_lines")
public class ConversationLine {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false)
   private String speaker; // e.g., "大卫", "李军", "王老师"

   @Column(name = "zh_text", nullable = false, length = 1000)
   private String zhText; // Chinese text

   @Column(nullable = false, length = 1000)
   private String pinyin; // Pinyin pronunciation

   @Column(name = "vn_translation", nullable = false, length = 1000)
   private String vnTranslation; // Vietnamese translation

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "conversation_id")
   private Conversation conversation;

   @Column(name = "line_order")
   private Integer order; // Thứ tự câu trong đoạn hội thoại

   // Audio cho mỗi câu hội thoại
   @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
   @JoinColumn(name = "audio_asset_id")
   private AudioAsset audioAsset;

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