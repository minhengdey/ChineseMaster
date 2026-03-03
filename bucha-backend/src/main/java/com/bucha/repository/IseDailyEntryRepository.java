package com.bucha.repository;

import com.bucha.entity.IseDailyEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface IseDailyEntryRepository extends JpaRepository<IseDailyEntry, Long> {

        @Query("SELECT e FROM IseDailyEntry e WHERE e.user.id = :userId AND e.sessionDate BETWEEN :start AND :end ORDER BY e.sessionDate")
        List<IseDailyEntry> findByUser_IdAndSessionDateBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

        @Query("SELECT COUNT(DISTINCT e.attemptId) FROM IseDailyEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId")
        long countDistinctAttemptsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

        @Query("SELECT e FROM IseDailyEntry e WHERE e.sessionDate BETWEEN :start AND :end ORDER BY e.sessionDate")
        List<IseDailyEntry> findBySessionDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

        @Query("SELECT e FROM IseDailyEntry e WHERE e.lessonId = :lessonId AND e.sessionDate BETWEEN :start AND :end ORDER BY e.sessionDate")
        List<IseDailyEntry> findByLessonIdAndSessionDateBetween(@Param("lessonId") Long lessonId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

        @Query("SELECT e FROM IseDailyEntry e WHERE e.lessonId = :lessonId")
        List<IseDailyEntry> findByLessonId(@Param("lessonId") Long lessonId);

        @Query(value = "SELECT d.user_id, SUM(CASE WHEN (d.vocabulary_id IS NOT NULL OR d.line_id IS NOT NULL) THEN 1 ELSE 0 END) AS cnt_d "
                        + "FROM ise_daily_entry d WHERE d.lesson_id = :lessonId GROUP BY d.user_id", nativeQuery = true)
        List<Object[]> aggregateDailyCountByUser(@Param("lessonId") Long lessonId);

        @Query(value = "SELECT d.user_id, SUM(CASE WHEN (d.vocabulary_id IS NOT NULL OR d.line_id IS NOT NULL) AND d.session_date BETWEEN :start AND :end THEN 1 ELSE 0 END) AS cnt_d "
                        + "FROM ise_daily_entry d WHERE d.lesson_id = :lessonId AND d.session_date BETWEEN :start AND :end GROUP BY d.user_id", nativeQuery = true)
        List<Object[]> aggregateDailyCountByUserAndDateRange(@Param("lessonId") Long lessonId,
                        @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

        @Query("SELECT DISTINCT e.lineId FROM IseDailyEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId AND e.lineId IS NOT NULL")
        List<Long> findDistinctLineIdsByUserAndLesson(@Param("userId") Long userId, @Param("lessonId") Long lessonId);

        @Query("SELECT DISTINCT e.vocabularyId FROM IseDailyEntry e WHERE e.user.id = :userId AND e.lessonId = :lessonId AND e.vocabularyId IS NOT NULL")
        List<Long> findDistinctVocabularyIdsByUserAndLesson(@Param("userId") Long userId,
                        @Param("lessonId") Long lessonId);

        @Query(value = "SELECT YEARWEEK(d.session_date, 1) AS yw, "
                        + "DATE(DATE_SUB(d.session_date, INTERVAL WEEKDAY(d.session_date) DAY)) AS week_start, "
                        + "d.user_id, AVG(COALESCE(d.total_score,0)) AS avg_score, COUNT(*) AS attempts, "
                        + "MAX(COALESCE(d.total_score,0)) AS best_score "
                        + "FROM ise_daily_entry d "
                        + "WHERE d.session_date IS NOT NULL "
                        + "GROUP BY yw, week_start, d.user_id "
                        + "ORDER BY week_start ASC", nativeQuery = true)
        List<Object[]> aggregateWeeklyLeaderboard();

        @Query(value = "SELECT YEARWEEK(d.session_date, 1) AS yw, "
                        + "DATE(DATE_SUB(d.session_date, INTERVAL WEEKDAY(d.session_date) DAY)) AS week_start, "
                        + "d.user_id, AVG(COALESCE(d.total_score,0)) AS avg_score, COUNT(*) AS attempts, "
                        + "MAX(COALESCE(d.total_score,0)) AS best_score "
                        + "FROM ise_daily_entry d "
                        + "WHERE d.session_date IS NOT NULL "
                        + "AND (:start IS NULL OR d.session_date >= :start) "
                        + "AND (:end IS NULL OR d.session_date < :end) "
                        + "GROUP BY yw, week_start, d.user_id "
                        + "ORDER BY week_start ASC", nativeQuery = true)
        List<Object[]> aggregateWeeklyLeaderboardBetween(@Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        @Query(value = "SELECT d.user_id, AVG(COALESCE(d.total_score,0)) AS avg_score, COUNT(*) AS attempts, "
                        + "MAX(COALESCE(d.total_score,0)) AS best_score "
                        + "FROM ise_daily_entry d "
                        + "WHERE d.session_date IS NOT NULL "
                        + "AND (:start IS NULL OR d.session_date >= :start) "
                        + "AND (:end IS NULL OR d.session_date < :end) "
                        + "GROUP BY d.user_id "
                        + "ORDER BY avg_score DESC", nativeQuery = true)
        List<Object[]> aggregateRangeLeaderboard(@Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /** Row: [DATE(session_date), avg_score, cnt_attempts, cnt_rows, duration_sum] */
        @Query(value = "SELECT DATE(session_date) AS day, AVG(total_score) AS avg_score, "
                        + "COUNT(DISTINCT attempt_id) AS cnt_attempts, COUNT(*) AS cnt_rows, COALESCE(SUM(duration_seconds),0) AS duration_sum "
                        + "FROM ise_daily_entry WHERE user_id = :userId AND session_date BETWEEN :start AND :end "
                        + "GROUP BY DATE(session_date)", nativeQuery = true)
        List<Object[]> aggregateDailyStatsByUserAndDateRange(@Param("userId") Long userId,
                        @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

        /** Row: [user_id, avg_score, cnt, best_score, ts] */
        @Query(value = "SELECT user_id, AVG(total_score) AS avg_score, COUNT(*) AS cnt, MAX(total_score) AS best_score, MIN(created_at) AS ts "
                        + "FROM ise_daily_entry WHERE session_date BETWEEN :start AND :end GROUP BY user_id", nativeQuery = true)
        List<Object[]> aggregateUserStatsByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
