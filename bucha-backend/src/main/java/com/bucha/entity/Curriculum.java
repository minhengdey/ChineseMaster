package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Builder
@AllArgsConstructor
@Table(name = "curriculums")
public class Curriculum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g., "HSK 1", "HSK 2", "Business Chinese"

    @Column(length = 1000)
    private String description;

    private String level; // e.g., "Beginner", "Intermediate", "Advanced"

    @Column(name = "curriculum_order", unique = true)
    private Integer order; // Thứ tự giáo trình

    @OneToMany(mappedBy = "curriculum", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Lesson> lessons = new ArrayList<>();

    // Constructors
    public Curriculum() {
    }

    public Curriculum(String name, String description, String level) {
        this.name = name;
        this.description = description;
        this.level = level;
    }

    public Curriculum(String name, String description, String level, Integer order) {
        this.name = name;
        this.description = description;
        this.level = level;
        this.order = order;
    }
}