package com.bucha.repository;

import com.bucha.entity.IseDailyEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface IseDailyEntryRepository extends JpaRepository<IseDailyEntry, Long> {
    List<IseDailyEntry> findByUser_IdAndSessionDateBetween(Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT e.attemptId) FROM IseDailyEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId")
    long countDistinctAttemptsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

    List<com.bucha.entity.IseDailyEntry> findBySessionDateBetween(LocalDateTime start, LocalDateTime end);

    List<com.bucha.entity.IseDailyEntry> findByLessonIdAndSessionDateBetween(Long lessonId, LocalDateTime start,
            LocalDateTime end);

    // fetch all entries for a lesson (no date filtering)
    List<com.bucha.entity.IseDailyEntry> findByLessonId(Long lessonId);

    @Query("SELECT DISTINCT e.lineId FROM IseDailyEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId AND e.lineId IS NOT NULL")
    List<Long> findDistinctLineIdsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

    @Query("SELECT DISTINCT e.vocabularyId FROM IseDailyEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId AND e.vocabularyId IS NOT NULL")
    List<Long> findDistinctVocabularyIdsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);
}
