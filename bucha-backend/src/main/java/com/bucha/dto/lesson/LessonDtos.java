package com.bucha.dto.lesson;

import java.util.List;

/**
 * DTOs for /api/lessons API (list and detail).
 */
public class LessonDtos {
    public static class LessonSummary {
        public Long id;
        public String title;
        public String level;
    }

    public static class LessonDetail {
        public Long id;
        public String title;
        public String level;
        public String content;
        public List<String> audioFiles;
    }
}
