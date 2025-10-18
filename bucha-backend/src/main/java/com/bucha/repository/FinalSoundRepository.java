package com.bucha.repository;

import com.bucha.entity.FinalSound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinalSoundRepository extends JpaRepository<FinalSound, Long> {
   Optional<FinalSound> findByExternalId(Long externalId);

   Optional<FinalSound> findByFinalText(String finalText);
}
