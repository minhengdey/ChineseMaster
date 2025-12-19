package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing the membership relationship between a user and a class
 */
@Getter
@Setter
@Entity
@Table(name = "class_memberships", uniqueConstraints = @UniqueConstraint(columnNames = { "class_id", "user_id" }))
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
}
