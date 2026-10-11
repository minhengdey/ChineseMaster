package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "`tones`")
public class Tone {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   private String name;
   @Column(name = "pitch_value")
   private String pitchValue;

   @Column(length = 2000)
   private String pronunciation;
   @Column(name = "tone_mark")
   private String toneMark;

   @Column(name = "external_id")
   private Long externalId;

   // Order index (1-based) used to number tones during migration so UI can refer
   // to tones by index
   @Column(name = "tones_order")
   private Integer order;

   @Column(name = "content_hash", length = 64)
   private String contentHash;

}
