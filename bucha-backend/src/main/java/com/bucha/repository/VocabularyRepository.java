package com.bucha.repository;

import com.bucha.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
   List<Vocabulary> findByLessonIdOrderByOrder(Long lessonId);

   Optional<Vocabulary> findByExternalId(Long externalId);

   @Query("SELECT v.externalId FROM Vocabulary v WHERE v.lesson.id = :lessonId")
   java.util.List<Long> findExternalIdsByLessonId(@Param("lessonId") Long lessonId);
}