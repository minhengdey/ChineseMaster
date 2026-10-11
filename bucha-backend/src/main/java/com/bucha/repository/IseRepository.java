package com.bucha.repository;

import com.bucha.entity.IseScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface IseRepository extends JpaRepository<IseScore, Long> {

    @Query("SELECT DISTINCT s.vocabularyId FROM IseScore s WHERE s.user.id = :userId AND s.vocabularyId IS NOT NULL")
    List<Long> findDistinctVocabularyIdsByUser(@Param("userId") Long userId);
}
