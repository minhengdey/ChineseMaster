package com.bucha.repository;

import com.bucha.entity.AudioAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AudioAssetRepository extends JpaRepository<AudioAsset, Long> {
   Optional<AudioAsset> findByFilename(String filename);

   Optional<AudioAsset> findByAudioPath(String audioPath);
}