package com.bucha.repository;

import com.bucha.entity.Tone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ToneRepository extends JpaRepository<Tone, Long> {
   Optional<Tone> findByExternalId(Long externalId);

   Optional<Tone> findByName(String name);
   Optional<Tone> findByToneMark(String toneMark);
}
