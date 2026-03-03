package com.bucha.repository;

import com.bucha.entity.FinalSound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinalSoundRepository extends JpaRepository<FinalSound, Long> {

   @Query("SELECT f FROM FinalSound f WHERE f.externalId = :externalId")
   Optional<FinalSound> findByExternalId(@Param("externalId") Long externalId);

   @Query("SELECT f FROM FinalSound f WHERE f.text = :text")
   Optional<FinalSound> findFirstByText(@Param("text") String text);
}
