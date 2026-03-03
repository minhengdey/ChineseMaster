package com.bucha.repository;

import com.bucha.entity.Line;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LineRepository extends JpaRepository<Line, Long> {

   @Query("SELECT l FROM Line l WHERE l.externalId = :externalId")
   Optional<Line> findByExternalId(@Param("externalId") Long externalId);
}
