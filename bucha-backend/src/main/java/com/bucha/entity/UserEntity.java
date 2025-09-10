package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "users")
public class UserEntity {
    // ... generate getters/setters (omitted for brevity)
    // We'll include plain getters/setters:
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable=false)
    private String email;

    @Column(nullable=false)
    private String password;

    private String name;

    private int xp = 0;
    private int streak = 0;

    private boolean darkMode = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_badges", joinColumns = @JoinColumn(name="user_id"))
    @Column(name = "badge")
    private Set<String> badges = new HashSet<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    // getters/setters
    public UserEntity() {}

}
