package com.bucha.repository;

import com.bucha.entity.InitialSound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InitialSoundRepository extends JpaRepository<InitialSound, Long> {
   Optional<InitialSound> findByExternalId(Long externalId);

   Optional<InitialSound> findByText(String text);
}
