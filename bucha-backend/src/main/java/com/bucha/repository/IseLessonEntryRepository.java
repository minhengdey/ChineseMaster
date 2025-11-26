package com.bucha.repository;

import com.bucha.entity.IseLessonEntry;
import com.bucha.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IseLessonEntryRepository extends JpaRepository<IseLessonEntry, Long> {
        List<IseLessonEntry> findByUser_Id(Long userId);

        List<IseLessonEntry> findByUser_IdAndLessonId(Long userId, Long lessonId);

        boolean existsByUserAndLessonId(UserEntity user, Long lessonId);

        @Query("SELECT COUNT(DISTINCT e.attemptId) FROM IseLessonEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId")
        long countDistinctAttemptsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

        @Query("SELECT e.user.id as userId, AVG(e.totalScore) as avgScore, COUNT(e) as cnt, MIN(e.sessionDate) as ts " +
                        "FROM IseLessonEntry e " +
                        "WHERE e.sessionDate BETWEEN :start AND :end " +
                        "GROUP BY e.user.id")
        List<Object[]> getWeeklyLeaderboardStats(@Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        @Query("SELECT e.user.id as userId, AVG(e.totalScore) as avgScore, COUNT(e) as cnt, MIN(e.sessionDate) as ts " +
                        "FROM IseLessonEntry e " +
                        "GROUP BY e.user.id")
        List<Object[]> getAllTimeLeaderboardStats();
}
