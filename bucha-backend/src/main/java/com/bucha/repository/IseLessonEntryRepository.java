package com.bucha.repository;

import com.bucha.entity.IseLessonEntry;
import com.bucha.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IseLessonEntryRepository extends JpaRepository<IseLessonEntry, Long> {
    List<IseLessonEntry> findByUser_Id(Long userId);

    List<IseLessonEntry> findByUser_IdAndLessonId(Long userId, Long lessonId);

    boolean existsByUserAndLessonId(UserEntity user, Long lessonId);

    @Query("SELECT COUNT(DISTINCT e.attemptId) FROM IseLessonEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId")
    long countDistinctAttemptsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);
}
