package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Entity
@Table(name = "conversation_lines")
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class ConversationLine {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "content_hash", length = 64)
   String contentHash;

   @Column(nullable = false)
   String speaker;

   @Column(name = "zh_text", nullable = false, length = 1000)
   String zhText;

   @Column(nullable = false, length = 1000)
   String pinyin;

   @Column(name = "vn_translation", nullable = false, length = 1000)
   String vnTranslation;

   @Column()
   String audioPublicId;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "conversation_id")
   Conversation conversation;

   @Column(name = "line_order")
   Integer order;
}