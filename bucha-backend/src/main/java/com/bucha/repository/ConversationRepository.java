package com.bucha.repository;

import com.bucha.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
   List<Conversation> findByLessonIdOrderByOrder(Long lessonId);

   Optional<Conversation> findByExternalId(Long externalId);
}