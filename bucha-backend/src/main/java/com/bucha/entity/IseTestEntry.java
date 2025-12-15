package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ise_test_entry")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IseTestEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Long testId;
    Long questionId; // Stores Question.externalId (not Question.id) - tracks which question this
                     // score is for
    Double totalScore;
    Double durationSeconds;

    // Per-section averaged scores for this test attempt
    @Column(name = "initial_score")
    Double initialScore;

    @Column(name = "final_score")
    Double finalScore;

    @Column(name = "tone_score")
    Double toneScore;

    @Column(name = "sentence_score")
    Double sentenceScore;

    Long attemptId;

    LocalDateTime sessionDate;
    LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    UserEntity user;
}
