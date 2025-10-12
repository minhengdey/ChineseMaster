package com.bucha.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ise_score")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IseScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Core metrics from ISE / computed
    Double totalScore;
    Double accuracy;
    Double fluency;
    Double completeness;

    // Additional telemetry
    Double durationSeconds;
    Integer numSentences;
    Integer numWrongWords;

    // Classification: whether this attempt should be counted towards
    // daily/lesson/test aggregates
    // e.g. values: "DAILY", "LESSON", "TEST", or null for raw attempts
    String scoreCategory;

    // If this attempt is tied to a lesson or a standardized test, optionally store
    // their ids
    // (foreign keys to other tables if present)
    Long lessonId;
    Long testId;

    // Whether this attempt should be included in daily averages (helps exclude
    // practice-only plays)
    Boolean includeInDaily = true;

    @Lob
    @Column(columnDefinition = "TEXT")
    String rawXml;

    LocalDateTime createdAt = LocalDateTime.now();
    // date of the practice session (useful to compute daily aggregates)
    LocalDateTime sessionDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    UserEntity user;
}
