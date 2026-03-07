package com.bucha.repository;

import com.bucha.entity.HSKKAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HSKKAnswerRepository extends JpaRepository<HSKKAnswer, Long> {

    List<HSKKAnswer> findByExamResultId(Long examResultId);
}
