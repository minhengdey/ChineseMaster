package com.bucha.repository;

import com.bucha.entity.ConversationLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationLineRepository extends JpaRepository<ConversationLine, Long> {
   List<ConversationLine> findByConversationIdOrderByOrder(Long conversationId);
}