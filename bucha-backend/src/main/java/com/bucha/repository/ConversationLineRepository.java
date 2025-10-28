package com.bucha.repository;

import com.bucha.entity.ConversationLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationLineRepository extends JpaRepository<ConversationLine, Long> {
   List<ConversationLine> findByConversationIdOrderByOrder(Long conversationId);

   @Query("SELECT COUNT(cl) FROM ConversationLine cl WHERE cl.conversation.lesson.id = :lessonId")
   long countByLessonId(@Param("lessonId") Long lessonId);

   Optional<ConversationLine> findByExternalId(Long externalId);

   @Query("SELECT cl.externalId FROM ConversationLine cl WHERE cl.conversation.lesson.id = :lessonId")
   java.util.List<Long> findExternalIdsByLessonId(@Param("lessonId") Long lessonId);
}