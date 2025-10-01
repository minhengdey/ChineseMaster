package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "lessons", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "curriculum_id", "lesson_order" })
})
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // e.g., "Bài 1 你好"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @Column(name = "lesson_order")
    private Integer order; // Thứ tự bài học trong giáo trình

    @Column()
    private String level;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Conversation> conversations = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vocabulary> vocabularies = new ArrayList<>();

    public Lesson() {
    }

    public Lesson(String title, Curriculum curriculum, Integer order) {
        this.title = title;
        this.curriculum = curriculum;
        this.order = order;
    }
}
