package com.bucha.repository;

import com.bucha.entity.IseDailyEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface IseDailyEntryRepository extends JpaRepository<IseDailyEntry, Long> {
    List<IseDailyEntry> findByUser_IdAndSessionDateBetween(Long userId, LocalDateTime start, LocalDateTime end);
}
