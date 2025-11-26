package com.bucha.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "users")
public class UserEntity {
    // ... generate getters/setters (omitted for brevity)
    // We'll include plain getters/setters:
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    private int xp = 0;
    private int streak = 0;

    private boolean darkMode = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_badges", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "badge")
    private Set<String> badges = new HashSet<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    // Role for authorization. Stored as Spring Security authority string (e.g.
    // ROLE_USER, ROLE_ADMIN)
    @Column(nullable = false)
    private String role = "ROLE_USER";

    // getters/setters
    public UserEntity() {
    }

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<IseScore> iseScores = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<UserLesson> userLessons = new ArrayList<>();

}
