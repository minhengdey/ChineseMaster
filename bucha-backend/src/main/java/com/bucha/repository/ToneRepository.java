package com.bucha.repository;

import com.bucha.entity.Tone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ToneRepository extends JpaRepository<Tone, Long> {

   @Query("SELECT t FROM Tone t WHERE t.externalId = :externalId")
   Optional<Tone> findByExternalId(@Param("externalId") Long externalId);

   Optional<Tone> findFirstByNameOrderByIdAsc(String name);

   Optional<Tone> findFirstByToneMarkOrderByIdAsc(String toneMark);

   Optional<Tone> findFirstByOrderOrderByIdAsc(Integer order);

   Optional<Tone> findFirstByNameIgnoreCaseOrderByIdAsc(String name);

   Optional<Tone> findFirstByPitchValueOrderByIdAsc(String pitchValue);

   Optional<Tone> findFirstByPitchValueIgnoreCaseOrderByIdAsc(String pitchValue);
}
