package com.bucha.repository;

import com.bucha.entity.IseLessonEntry;
import com.bucha.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IseLessonEntryRepository extends JpaRepository<IseLessonEntry, Long> {

    @Query("SELECT e FROM IseLessonEntry e WHERE e.user.id = :userId")
    List<IseLessonEntry> findByUser_Id(@Param("userId") Long userId);

    @Query("SELECT e FROM IseLessonEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId")
    List<IseLessonEntry> findByUser_IdAndLessonId(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM IseLessonEntry e WHERE e.user = :user AND e.lessonId = :lessonId")
    boolean existsByUserAndLessonId(@Param("user") UserEntity user, @Param("lessonId") Long lessonId);

    @Query("SELECT COUNT(DISTINCT e.attemptId) FROM IseLessonEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId")
    long countDistinctAttemptsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

    @Query("SELECT e.user.id, SUM(COALESCE(e.totalScore,0)) FROM IseLessonEntry e WHERE e.lessonId = :lessonId GROUP BY e.user.id")
    List<Object[]> sumTotalScoreByLessonGroupByUser(@Param("lessonId") Long lessonId);

    @Query("SELECT e.user.id, SUM(COALESCE(e.totalScore,0)) FROM IseLessonEntry e WHERE e.lessonId = :lessonId AND e.createdAt BETWEEN :start AND :end GROUP BY e.user.id")
    List<Object[]> sumTotalScoreByLessonGroupByUserAndDateRange(@Param("lessonId") Long lessonId,
            @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query(value = "SELECT e.user_id, AVG(COALESCE(e.total_score,0)) AS avg_score, COUNT(e.attempt_id) AS cnt_e, MAX(e.total_score) AS best "
            + "FROM ise_lesson_entry e "
            + "WHERE e.lesson_id = :lessonId "
            + "GROUP BY e.user_id", nativeQuery = true)
    List<Object[]> aggregateLessonEntryByUser(@Param("lessonId") Long lessonId);

    @Query(value = "SELECT e.user_id, AVG(COALESCE(e.total_score,0)) AS avg_score, COUNT(e.attempt_id) AS cnt_e, MAX(e.total_score) AS best "
            + "FROM ise_lesson_entry e "
            + "WHERE e.lesson_id = :lessonId AND e.created_at BETWEEN :start AND :end "
            + "GROUP BY e.user_id", nativeQuery = true)
    List<Object[]> aggregateLessonEntryByUserAndDateRange(@Param("lessonId") Long lessonId,
            @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query(value = "SELECT e.lesson_id, e.user_id, AVG(COALESCE(e.total_score,0)) AS avg_score, "
            + "COUNT(e.attempt_id) AS attempts, MAX(COALESCE(e.total_score,0)) AS best_score "
            + "FROM ise_lesson_entry e "
            + "GROUP BY e.lesson_id, e.user_id "
            + "ORDER BY e.lesson_id ASC", nativeQuery = true)
    List<Object[]> aggregateLessonLeaderboard();
}
