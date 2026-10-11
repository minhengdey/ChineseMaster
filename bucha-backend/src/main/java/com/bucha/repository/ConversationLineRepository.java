package com.bucha.repository;

import com.bucha.entity.ConversationLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationLineRepository extends JpaRepository<ConversationLine, Long> {

   @Query("SELECT cl FROM ConversationLine cl WHERE cl.conversation.id = :conversationId ORDER BY cl.order")
   List<ConversationLine> findByConversationIdOrderByOrder(@Param("conversationId") Long conversationId);

   @Query("SELECT cl FROM ConversationLine cl JOIN FETCH cl.conversation WHERE cl.conversation.lesson.id = :lessonId ORDER BY cl.conversation.order, cl.order")
   List<ConversationLine> findByConversation_Lesson_IdOrderByConversation_OrderAscOrderAsc(@Param("lessonId") Long lessonId);

   @Query("SELECT cl FROM ConversationLine cl JOIN FETCH cl.conversation WHERE cl.conversation.id IN :conversationIds ORDER BY cl.conversation.id, cl.order")
   List<ConversationLine> findByConversation_IdIn(@Param("conversationIds") List<Long> conversationIds);

   @Query("SELECT COUNT(cl) FROM ConversationLine cl WHERE cl.conversation.lesson.id = :lessonId")
   long countByLessonId(@Param("lessonId") Long lessonId);

   @Query("SELECT cl FROM ConversationLine cl WHERE cl.externalId = :externalId")
   Optional<ConversationLine> findByExternalId(@Param("externalId") Long externalId);

   @Query("SELECT cl.externalId FROM ConversationLine cl WHERE cl.conversation.lesson.id = :lessonId")
   List<Long> findExternalIdsByLessonId(@Param("lessonId") Long lessonId);
}