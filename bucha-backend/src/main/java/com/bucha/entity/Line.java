package com.bucha.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "`lines`")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Line {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(name = "external_id")
   private Long externalId;

   @Column(name = "content_hash", length = 64)
   private String contentHash;

   @Column(name = "zh_text", nullable = false, length = 1000)
   private String zhText; // Chinese text

   @Column(nullable = false, length = 1000)
   private String pinyin; // Pinyin pronunciation

   @Column(name = "vn_translation", nullable = false, length = 1000)
   private String vnTranslation; // Vietnamese translation

   @Column(name = "audio_public_id")
   private String audioPublicId;

}
