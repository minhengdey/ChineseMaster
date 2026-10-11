package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "hskk_answers")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HSKKAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    HSKKExamResult examResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    HSKKQuestion question;

    /** Stored user recording URL (optional). */
    @Column(name = "audio_url", length = 1024)
    String audioUrl;

    /** Pronunciation score from iFlytek (0–100). */
    @Column(name = "pronunciation_score")
    Double pronunciationScore;

    /** Short feedback from Doubao AI (max 100 chars). */
    @Column(name = "ai_feedback", length = 500)
    String aiFeedback;
}
