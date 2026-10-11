package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "hskk_questions")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HSKKQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /** Question text (sentence or prompt). */
    @Column(nullable = false, columnDefinition = "TEXT")
    String text;

    /** Part number: 1 = repeat sentence, 2 = short answer, 3 = open speaking. */
    @Column(nullable = false)
    Integer part;

    /** Display order within part (1-based). */
    @Column(name = "question_order", nullable = false)
    Integer questionOrder;

    /** URL to reference audio (for Part 1 & 2). Null for Part 3 if no audio. */
    @Column(name = "audio_url", length = 1024)
    String audioUrl;
}
