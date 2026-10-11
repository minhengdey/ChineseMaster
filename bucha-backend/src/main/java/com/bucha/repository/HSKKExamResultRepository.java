package com.bucha.repository;

import com.bucha.entity.HSKKExamResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HSKKExamResultRepository extends JpaRepository<HSKKExamResult, Long> {

    List<HSKKExamResult> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
