package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "final_sounds")
public class FinalSound {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   String category;

   @Column(name = "text")
   String text;

   String ipa;

   @Column(length = 2000)
   String pronunciation;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "content_hash", length = 64)
   String contentHash;
}
