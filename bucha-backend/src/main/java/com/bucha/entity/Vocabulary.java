package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "vocabularies")
public class Vocabulary {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false)
   private String word; // Chinese word/phrase

   @Column(nullable = false)
   private String pinyin; // Pinyin pronunciation

   @Column(nullable = false)
   private String type; // e.g., "danh từ", "động từ", "tính từ", "cụm từ"

   @Column(nullable = false, length = 500)
   private String meaning; // Vietnamese meaning

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "lesson_id")
   private Lesson lesson;

   @Column(name = "word_order")
   private Integer order; // Thứ tự từ vựng trong bài học

   // Audio cho mỗi từ vựng
   @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
   @JoinColumn(name = "audio_asset_id")
   private AudioAsset audioAsset;

   // Constructors
   public Vocabulary() {
   }

   public Vocabulary(String word, String pinyin, String type, String meaning,
         Lesson lesson, Integer order) {
      this.word = word;
      this.pinyin = pinyin;
      this.type = type;
      this.meaning = meaning;
      this.lesson = lesson;
      this.order = order;
   }
}