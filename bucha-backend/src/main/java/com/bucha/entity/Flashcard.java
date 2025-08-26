package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "flashcards")
public class Flashcard {
    // getters/setters
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // owner
    private String hanzi;
    private String pinyin;
    private String meaning;

    // SM-2 fields
    private double efactor = 2.5;

    // Avoid using reserved word "interval" -> use intervalDays mapped to column interval_days
    @Column(name = "interval_days")
    private int intervalDays = 0; // days

    private int box = 1;

    @Column(name = "next_review")
    private LocalDateTime nextReview;

    public Flashcard() {}

}
