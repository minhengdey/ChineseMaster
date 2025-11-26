package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "lessons", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "curriculum_id", "lesson_order" })
})
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "external_id")
    Long externalId;

    @Column(nullable = false)
    String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    Curriculum curriculum;

    @Column(name = "lesson_order")
    Integer order;

    @Column()
    String level;

    @Column(name = "content_hash", length = 64)
    String contentHash;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Conversation> conversations = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Vocabulary> vocabularies = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    List<UserLesson> userLessons = new ArrayList<>();
}
