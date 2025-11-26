package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ise_daily_entry")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IseDailyEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Double totalScore;
    Double durationSeconds;

    Long attemptId;

    Long lessonId;
    Long lineId;
    Long vocabularyId;

    LocalDateTime sessionDate;
    LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;
}
