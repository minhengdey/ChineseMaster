package com.bucha.dto;

import java.util.List;

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
