package com.bucha.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Entity
@Table(name = "vocabularies")
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class Vocabulary {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "content_hash", length = 64)
   String contentHash;

   @Column(nullable = false)
   String word;

   @Column(nullable = false)
   String pinyin;

   @Column(nullable = false)
   String type;

   @Column(nullable = false, length = 500)
   String meaning;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "lesson_id")
   Lesson lesson;

   @Column(name = "word_order")
   Integer order;

   @Column(name = "audio_public_id")
   String audioPublicId;

   @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
   @JoinColumn(name = "example_line_id", referencedColumnName = "id")
   Line example;
}