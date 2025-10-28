package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "classes")
@Getter
@Setter
public class ClassEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "aClass", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClassMembership> members = new ArrayList<>();
}
