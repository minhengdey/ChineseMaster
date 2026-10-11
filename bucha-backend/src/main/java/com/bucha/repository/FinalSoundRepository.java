package com.bucha.repository;

import com.bucha.entity.FinalSound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinalSoundRepository extends JpaRepository<FinalSound, Long> {

   @Query("SELECT f FROM FinalSound f WHERE f.externalId = :externalId")
   Optional<FinalSound> findByExternalId(@Param("externalId") Long externalId);

   /** Stable pick when duplicate {@code text} rows exist (migration / data issues). */
   Optional<FinalSound> findFirstByTextOrderByIdAsc(String text);

   Optional<FinalSound> findFirstByTextIgnoreCaseOrderByIdAsc(String text);

   List<FinalSound> findAllByTextOrderByIdAsc(String text);

   List<FinalSound> findAllByTextIgnoreCaseOrderByIdAsc(String text);
}
