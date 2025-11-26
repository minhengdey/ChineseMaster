package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "flashcards")
public class Flashcard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Long userId;
    String hanzi;
    String pinyin;
    String meaning;

    double efactor = 2.5;

    @Column(name = "interval_days")
    int intervalDays = 0;

    int box = 1;

    @Column(name = "next_review")
    LocalDateTime nextReview;
}
