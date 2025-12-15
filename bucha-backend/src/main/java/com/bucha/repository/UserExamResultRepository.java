package com.bucha.repository;

import com.bucha.entity.UserExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserExamResultRepository extends JpaRepository<UserExamResult, Long> {

        @Query("SELECT uer FROM UserExamResult uer WHERE uer.user.id = :userId AND uer.exam.externalId = :examExternalId ORDER BY uer.completedAt DESC")
        List<UserExamResult> findByUserIdAndExamExternalId(@Param("userId") Long userId,
                        @Param("examExternalId") Long examExternalId);

        @Query("SELECT uer FROM UserExamResult uer WHERE uer.user.id = :userId AND uer.exam.id = :examId ORDER BY uer.completedAt DESC LIMIT 1")
        Optional<UserExamResult> findLatestByUserIdAndExamId(@Param("userId") Long userId,
                        @Param("examId") Long examId);

        @Query("SELECT uer FROM UserExamResult uer WHERE uer.user.id = :userId AND uer.exam.externalId = :examExternalId ORDER BY uer.completedAt DESC LIMIT 1")
        Optional<UserExamResult> findLatestByUserIdAndExamExternalId(@Param("userId") Long userId,
                        @Param("examExternalId") Long examExternalId);

        @Query("SELECT uer FROM UserExamResult uer WHERE uer.user.id = :userId ORDER BY uer.completedAt DESC")
        List<UserExamResult> findAllByUserId(@Param("userId") Long userId);

        @Query("SELECT COUNT(DISTINCT uer.exam.externalId) FROM UserExamResult uer WHERE uer.user.id = :userId")
        Long countCompletedExamsByUserId(@Param("userId") Long userId);
}
