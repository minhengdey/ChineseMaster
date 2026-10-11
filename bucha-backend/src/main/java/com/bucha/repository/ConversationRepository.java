package com.bucha.repository;

import com.bucha.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

   @Query("SELECT c FROM Conversation c WHERE c.lesson.id = :lessonId ORDER BY c.order")
   List<Conversation> findByLessonIdOrderByOrder(@Param("lessonId") Long lessonId);

   // ORDER BY l.id (not c.lesson.id) so MySQL strict mode sees expression in SELECT list if DISTINCT is ever added
   @Query("SELECT c FROM Conversation c JOIN FETCH c.lesson l WHERE l.id IN :lessonIds ORDER BY l.id, c.order")
   List<Conversation> findByLesson_IdIn(@Param("lessonIds") List<Long> lessonIds);

   @Query("SELECT c FROM Conversation c WHERE c.externalId = :externalId")
   Optional<Conversation> findByExternalId(@Param("externalId") Long externalId);
}