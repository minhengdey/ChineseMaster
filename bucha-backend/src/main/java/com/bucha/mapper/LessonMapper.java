package com.bucha.mapper;

import com.bucha.dto.lesson.LessonDtos.LessonDetail;
import com.bucha.dto.lesson.LessonDtos.LessonSummary;
import com.bucha.entity.Lesson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class LessonMapper {

    public LessonSummary toSummary(Lesson entity) {
        if (entity == null) return null;
        LessonSummary dto = new LessonSummary();
        dto.id = entity.getId();
        dto.title = entity.getTitle();
        dto.level = entity.getLevel();
        return dto;
    }

    public LessonDetail toDetail(Lesson entity) {
        if (entity == null) return null;
        LessonDetail dto = new LessonDetail();
        dto.id = entity.getId();
        dto.title = entity.getTitle();
        dto.level = entity.getLevel();
        dto.content = null;
        dto.audioFiles = new ArrayList<>();
        return dto;
    }
}
