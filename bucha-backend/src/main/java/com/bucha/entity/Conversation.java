package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "conversations")
public class Conversation {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(name = "external_id")
   private Long externalId;

   @Column(name = "content_hash", length = 64)
   private String contentHash;
   @Column(nullable = false)
   private String section; // e.g., "你好吗", "你叫什么名字？"

   @Column(name = "vn_translation", length = 500)
   private String vnTranslation; // Vietnamese translation of the section

   @Column
   private String audioPublicId;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "lesson_id")
   private Lesson lesson;

   @Column(name = "conversation_order")
   private Integer order; // Thứ tự đoạn hội thoại trong bài học

   @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
   private List<ConversationLine> lines = new ArrayList<>();

   // Constructors
   public Conversation() {
   }

   public Conversation(String section, String vnTranslation, Lesson lesson, Integer order) {
      this.section = section;
      this.vnTranslation = vnTranslation;
      this.lesson = lesson;
      this.order = order;
   }
}