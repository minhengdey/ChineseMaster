package com.bucha.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bucha.entity.Line;

import java.util.Optional;

public interface LineRepository extends JpaRepository<Line, Long> {

   Optional<Line> findByExternalId(Long externalId);

}
