package com.bucha.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a class/course in the system
 */
@Getter
@Setter
@Entity
@Table(name = "classes")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClassMembership> members = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * Helper method to add a member to the class
     */
    public void addMember(UserEntity user) {
        ClassMembership membership = ClassMembership.builder()
                .classEntity(this)
                .user(user)
                .build();
        members.add(membership);
    }

    /**
     * Helper method to remove a member from the class
     */
    public void removeMember(UserEntity user) {
        members.removeIf(membership -> membership.getUser().getId().equals(user.getId()));
    }

    /**
     * Get the count of members in this class
     */
    public int getMemberCount() {
        return members != null ? members.size() : 0;
    }
}
