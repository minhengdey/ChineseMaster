package com.bucha.repository;

import com.bucha.entity.InitialSound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InitialSoundRepository extends JpaRepository<InitialSound, Long> {

   @Query("SELECT i FROM InitialSound i WHERE i.externalId = :externalId")
   Optional<InitialSound> findByExternalId(@Param("externalId") Long externalId);

   @Query("SELECT i FROM InitialSound i WHERE i.text = :text")
   Optional<InitialSound> findFirstByText(@Param("text") String text);
}
