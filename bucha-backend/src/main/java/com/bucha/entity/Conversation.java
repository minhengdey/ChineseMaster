package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "conversations")
public class Conversation {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "content_hash", length = 64)
   String contentHash;

   @Column(nullable = false)
   String section;

   @Column(name = "vn_translation", length = 500)
   String vnTranslation;

   @Column
   String audioPublicId;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "lesson_id")
   Lesson lesson;

   @Column(name = "conversation_order")
   Integer order; // Thứ tự đoạn hội thoại trong bài học

   @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
   List<ConversationLine> lines = new ArrayList<>();
}