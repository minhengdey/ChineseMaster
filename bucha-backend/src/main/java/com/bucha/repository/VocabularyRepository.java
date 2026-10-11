package com.bucha.repository;

import com.bucha.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

   @Query("SELECT v FROM Vocabulary v WHERE v.lesson.id = :lessonId ORDER BY v.order")
   List<Vocabulary> findByLessonIdOrderByOrder(@Param("lessonId") Long lessonId);

   // No ORDER BY here: MySQL DISTINCT requires ORDER BY columns in SELECT list. Sort in service instead.
   @Query("SELECT DISTINCT v FROM Vocabulary v LEFT JOIN FETCH v.example JOIN FETCH v.lesson WHERE v.lesson.id IN :lessonIds")
   List<Vocabulary> findByLesson_IdInWithExample(@Param("lessonIds") List<Long> lessonIds);

   @Query("SELECT v FROM Vocabulary v WHERE v.externalId = :externalId")
   Optional<Vocabulary> findByExternalId(@Param("externalId") Long externalId);

   @Query("SELECT v.externalId FROM Vocabulary v WHERE v.lesson.id = :lessonId")
   List<Long> findExternalIdsByLessonId(@Param("lessonId") Long lessonId);

   /**
    * Search by word, pinyin, meaning, or example line (zh/vn). Uses LOWER + LIKE for case-insensitive match.
    * Order by id to avoid MySQL DISTINCT/ORDER BY issues with joins.
    */
   @Query("SELECT v FROM Vocabulary v LEFT JOIN FETCH v.example JOIN FETCH v.lesson WHERE "
         + "(LOWER(v.word) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "OR LOWER(v.pinyin) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "OR LOWER(v.meaning) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "OR (v.example IS NOT NULL AND (LOWER(v.example.zhText) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "OR LOWER(v.example.vnTranslation) LIKE LOWER(CONCAT('%', :q, '%')))))")
   Page<Vocabulary> searchByQuery(@Param("q") String q, Pageable pageable);
}