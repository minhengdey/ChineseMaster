package com.bucha.dto.flashcard;

import java.time.LocalDateTime;

/**
 * DTOs for flashcard API.
 */
public class FlashcardDtos {
    public static class FlashcardDto {
        public Long id;
        public String hanzi;
        public String pinyin;
        public String meaning;
        public LocalDateTime nextReview;
        public int interval;
        public double efactor;
        public int box;
    }

    public static class ReviewRequest {
        public String result; // "again", "good", "easy"
    }
}
