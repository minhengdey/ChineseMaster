package com.bucha.service;

import com.bucha.entity.Flashcard;
import com.bucha.repository.FlashcardRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class FlashcardServiceTest {
    @Autowired FlashcardService service;
    @Autowired FlashcardRepository repo;

    @BeforeEach
    void cleanup() {
        repo.deleteAll();
    }

    @Test
    void reviewEasyIncreasesInterval() {
        Flashcard f = new Flashcard();
        f.setUserId(1L);
        f.setHanzi("你");
        repo.save(f);

        Flashcard updated = service.review(f.getId(), "easy");
        assertTrue(updated.getIntervalDays() > 0);
        assertNotNull(updated.getNextReview());
        assertTrue(updated.getEfactor() >= 1.3);
    }
}
