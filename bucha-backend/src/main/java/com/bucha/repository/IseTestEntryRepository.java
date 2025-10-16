package com.bucha.repository;

import com.bucha.entity.IseTestEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IseTestEntryRepository extends JpaRepository<IseTestEntry, Long> {
    List<IseTestEntry> findByUser_Id(Long userId);

    List<IseTestEntry> findByUser_IdAndTestId(Long userId, Long testId);
}
