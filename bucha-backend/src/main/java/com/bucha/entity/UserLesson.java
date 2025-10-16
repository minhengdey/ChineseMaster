package com.bucha.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_lessons", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "lesson_id" })
})
@Getter
@Setter
public class UserLesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(nullable = false)
    private boolean inProgress = false;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt = LocalDateTime.now();
}
