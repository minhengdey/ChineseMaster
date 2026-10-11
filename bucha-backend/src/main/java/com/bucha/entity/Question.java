package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "questions")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Long externalId;
    @Enumerated(EnumType.STRING)
    QuestionType questionType;

    @Column(name = "question_order")
    Integer order;

    String content;

    String audioPublicId;

    @ManyToOne
    @JoinColumn
    Exam exam;
}
