package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@Table(name = "`tones`")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Tone {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   Long id;

   String name;
   String pitchValue;

   @Column(length = 2000)
   String pronunciation;
   @Column(name = "tone_mark")
   String toneMark;

   @Column(name = "external_id")
   Long externalId;

   @Column(name = "tones_order")
   Integer order;

   @Column(name = "content_hash", length = 64)
   String contentHash;

}
