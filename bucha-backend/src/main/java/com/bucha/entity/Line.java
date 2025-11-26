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
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@Table(name = "`lines`")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Line {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "content_hash", length = 64)
   String contentHash;

   @Column(name = "zh_text", nullable = false, length = 1000)
   String zhText;

   @Column(nullable = false, length = 1000)
   String pinyin;

   @Column(name = "vn_translation", nullable = false, length = 1000)
   String vnTranslation;

   @Column()
   String audioPublicId;

}
