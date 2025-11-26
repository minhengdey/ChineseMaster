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

    @Column(name = "test_id")
    Long testId;
    
    @Column(name = "total_score")
    Double totalScore;
    
    @Column(name = "duration_seconds")
    Double durationSeconds;

    @Column(name = "attempt_id")
    Long attemptId;

    @Column(name = "session_date")
    LocalDateTime sessionDate;
    
    @Column(name = "created_at")
    LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    UserEntity user;
}
