package com.bucha.repository;

import com.bucha.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    Exam getExamsByExternalId(Long externalId);

    void deleteByExternalId(Long externalId);
}
