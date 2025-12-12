package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "user_exam_results")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    Exam exam;

    @Column(nullable = false)
    Double totalScore;

    Double initialScore;
    Double finalScore;
    Double toneScore;
    Double sentenceScore;

    @Column(columnDefinition = "TEXT")
    String detailsJson;

    @CreationTimestamp
    @Column(name = "completed_at", nullable = false, updatable = false)
    LocalDateTime completedAt;

    @Column(name = "duration_seconds")
    Integer durationSeconds;
}
