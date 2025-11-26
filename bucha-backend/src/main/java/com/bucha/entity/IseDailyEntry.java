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

    @Column(name = "total_score")
    Double totalScore;
    
    @Column(name = "duration_seconds")
    Double durationSeconds;

    // reference to original attempt if needed
    @Column(name = "attempt_id")
    Long attemptId;

    // If the attempt is associated with a lesson or a specific line/vocabulary
    // within a lesson
    @Column(name = "lesson_id")
    Long lessonId;
    
    @Column(name = "line_id")
    Long lineId;
    
    @Column(name = "vocabulary_id")
    Long vocabularyId;

    @Column(name = "session_date")
    LocalDateTime sessionDate;
    
    @Column(name = "created_at")
    LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    UserEntity user;
}
