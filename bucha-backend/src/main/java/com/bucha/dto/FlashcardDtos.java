package com.bucha.dto;

import java.time.LocalDateTime;

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
