package com.bucha.repository;

import com.bucha.entity.IseTestEntry;
import com.bucha.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IseTestEntryRepository extends JpaRepository<IseTestEntry, Long> {
    List<IseTestEntry> findByUser_Id(Long userId);

    List<IseTestEntry> findByUser_IdAndTestId(Long userId, Long testId);

    Optional<IseTestEntry> findTopByTestIdAndUserAndQuestionIdOrderByIdDesc(Long testId, UserEntity user,
            Long questionId);

    List<IseTestEntry> findByTestIdAndUser(Long testId, UserEntity user);

    @Modifying
    @Query("DELETE FROM IseTestEntry e WHERE e.testId = :testId AND e.user.id = :userId")
    int deleteByTestIdAndUserId(@Param("testId") Long testId, @Param("userId") Long userId);
}
