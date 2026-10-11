package com.bucha.repository;

import com.bucha.entity.Question;
import com.bucha.entity.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query("SELECT q FROM Question q WHERE q.exam.externalId = :examExternalId ORDER BY q.order ASC")
    List<Question> findByExamExternalIdOrderByOrder(@Param("examExternalId") Long examExternalId);

    @Query("SELECT q FROM Question q WHERE q.exam.externalId = :examExternalId AND q.questionType = :type ORDER BY q.id ASC")
    List<Question> findByExamExternalIdAndType(@Param("examExternalId") Long examExternalId,
            @Param("type") QuestionType type);
}
