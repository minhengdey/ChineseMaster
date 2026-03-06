package com.bucha.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "hskk_exam_results")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HSKKExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;

    @Column(name = "total_score", nullable = false)
    Double totalScore;

    @Column(name = "part1_score")
    Double part1Score;

    @Column(name = "part2_score")
    Double part2Score;

    @Column(name = "part3_score")
    Double part3Score;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @OneToMany(mappedBy = "examResult", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<HSKKAnswer> answers = new ArrayList<>();
}
