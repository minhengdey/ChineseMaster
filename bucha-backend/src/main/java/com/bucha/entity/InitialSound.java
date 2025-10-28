package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "initial_sounds")
public class InitialSound {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   private String type;
   private String text;
   private String ipa;

   @Column(length = 2000)
   private String pronunciation;

   @Column(name = "external_id")
   private Long externalId;

   @Column(name = "content_hash", length = 64)
   private String contentHash;
}
