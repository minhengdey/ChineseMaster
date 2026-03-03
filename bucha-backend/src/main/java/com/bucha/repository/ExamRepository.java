package com.bucha.repository;

import com.bucha.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    @Query("SELECT e FROM Exam e WHERE e.externalId = :externalId")
    Optional<Exam> findByExternalId(@Param("externalId") Long externalId);

    @Query("SELECT e FROM Exam e ORDER BY e.order ASC")
    List<Exam> findAllByOrderAsc();

    @Query("SELECT e FROM Exam e LEFT JOIN FETCH e.questions WHERE e.externalId = :externalId")
    Optional<Exam> findByExternalIdWithQuestions(@Param("externalId") Long externalId);

    @Modifying
    @Query("DELETE FROM Exam e WHERE e.externalId = :externalId")
    void deleteByExternalId(@Param("externalId") Long externalId);
}
