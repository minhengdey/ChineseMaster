package com.bucha.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "ise_score")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IseScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Double totalScore;
    Double accuracy;
    Double fluency;
    Double completeness;
    Double durationSeconds;
    Integer numSentences;
    Integer numWrongWords;
    String scoreCategory;
    Long lessonId;
    Long lineId;
    Long vocabularyId;
    Long testId;
    Boolean includeInDaily = true;
    LocalDateTime createdAt = LocalDateTime.now();
    LocalDateTime sessionDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    User user;
}
