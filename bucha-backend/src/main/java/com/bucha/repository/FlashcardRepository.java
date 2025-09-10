package com.bucha.repository;

import com.bucha.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByUserIdOrderByNextReviewAsc(Long userId);
}
