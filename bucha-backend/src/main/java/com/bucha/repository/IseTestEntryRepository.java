package com.bucha.repository;

import com.bucha.entity.IseTestEntry;
import com.bucha.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IseTestEntryRepository extends JpaRepository<IseTestEntry, Long> {

    @Query("SELECT e FROM IseTestEntry e WHERE e.user.id = :userId")
    List<IseTestEntry> findByUser_Id(@Param("userId") Long userId);

    @Query("SELECT e FROM IseTestEntry e WHERE e.user.id = :userId AND e.testId = :testId")
    List<IseTestEntry> findByUser_IdAndTestId(@Param("userId") Long userId, @Param("testId") Long testId);

    @Query("SELECT e FROM IseTestEntry e WHERE e.testId = :testId AND e.user = :user AND e.questionId = :questionId ORDER BY e.id DESC")
    List<IseTestEntry> findByTestIdAndUserAndQuestionIdOrderByIdDesc(@Param("testId") Long testId, @Param("user") UserEntity user, @Param("questionId") Long questionId, Pageable pageable);

    default Optional<IseTestEntry> findTopByTestIdAndUserAndQuestionIdOrderByIdDesc(Long testId, UserEntity user, Long questionId) {
        List<IseTestEntry> list = findByTestIdAndUserAndQuestionIdOrderByIdDesc(testId, user, questionId, PageRequest.of(0, 1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("SELECT e FROM IseTestEntry e WHERE e.testId = :testId AND e.user = :user")
    List<IseTestEntry> findByTestIdAndUser(@Param("testId") Long testId, @Param("user") UserEntity user);

    @Modifying
    @Query("DELETE FROM IseTestEntry e WHERE e.testId = :testId AND e.user.id = :userId")
    int deleteByTestIdAndUserId(@Param("testId") Long testId, @Param("userId") Long userId);

    @Query(value = "SELECT e.test_id, e.user_id, AVG(COALESCE(e.total_score,0)) AS avg_score, "
            + "COUNT(e.attempt_id) AS attempts, MAX(COALESCE(e.total_score,0)) AS best_score "
            + "FROM ise_test_entry e "
            + "WHERE e.test_id IS NOT NULL "
            + "GROUP BY e.test_id, e.user_id "
            + "ORDER BY e.test_id ASC", nativeQuery = true)
    List<Object[]> aggregateTestLeaderboard();
}
