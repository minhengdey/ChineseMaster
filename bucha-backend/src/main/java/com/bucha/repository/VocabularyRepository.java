package com.bucha.repository;

import com.bucha.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
   List<Vocabulary> findByLessonIdOrderByOrder(Long lessonId);

   Optional<Vocabulary> findByExternalId(Long externalId);
}