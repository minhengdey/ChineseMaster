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
@Table(name = "initial_sounds")
public class InitialSound {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   String type;
   String text;
   String ipa;

   @Column(length = 2000)
   String pronunciation;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "content_hash", length = 64)
   String contentHash;
}
