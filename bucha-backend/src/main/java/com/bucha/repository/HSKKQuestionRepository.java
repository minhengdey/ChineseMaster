package com.bucha.repository;

import com.bucha.entity.HSKKQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HSKKQuestionRepository extends JpaRepository<HSKKQuestion, Long> {

    List<HSKKQuestion> findAllByOrderByPartAscQuestionOrderAsc();
}
