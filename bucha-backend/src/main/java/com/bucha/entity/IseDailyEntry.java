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
@Table(name = "ise_daily_entry")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IseDailyEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Double totalScore;
    Double durationSeconds;

    // reference to original attempt if needed
    Long attemptId;

    // If the attempt is associated with a lesson or a specific line/vocabulary
    // within a lesson
    Long lessonId;
    Long lineId;
    Long vocabularyId;

    LocalDateTime sessionDate;
    LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    UserEntity user;
}
