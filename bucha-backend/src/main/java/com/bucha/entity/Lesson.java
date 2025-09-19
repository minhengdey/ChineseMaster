package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "lessons")
public class Lesson {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String level; // e.g. HSK1, HSK2

    @Column(length = 2048)
    private String content; // could be JSON or HTML snippet

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "lesson_id")
    private List<AudioAsset> audioAssets = new ArrayList<>();

    // getters/setters
    public Lesson() {}

}
