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

   @Query("SELECT t FROM Tone t WHERE t.name = :name")
   Optional<Tone> findByName(@Param("name") String name);

   @Query("SELECT t FROM Tone t WHERE t.toneMark = :toneMark")
   Optional<Tone> findByToneMark(@Param("toneMark") String toneMark);

   @Query("SELECT t FROM Tone t WHERE t.order = :order")
   Optional<Tone> findByOrder(@Param("order") Integer order);
}
