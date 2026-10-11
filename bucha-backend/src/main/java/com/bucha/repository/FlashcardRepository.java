package com.bucha.repository;

import com.bucha.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    @Query("SELECT f FROM Flashcard f WHERE f.userId = :userId ORDER BY f.nextReview ASC")
    List<Flashcard> findByUserIdOrderByNextReviewAsc(@Param("userId") Long userId);
}
