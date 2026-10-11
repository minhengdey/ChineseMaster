package com.bucha.service;

import com.bucha.dto.lesson.LessonDtos.LessonDetail;
import com.bucha.dto.lesson.LessonDtos.LessonSummary;
import com.bucha.entity.Lesson;
import com.bucha.mapper.LessonMapper;
import com.bucha.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;

    public List<LessonSummary> list(String level) {
        List<Lesson> lessons = (level == null) ? lessonRepository.findAll() : lessonRepository.findByLevel(level);
        return lessons.stream().map(lessonMapper::toSummary).collect(Collectors.toList());
    }

    public Optional<LessonDetail> get(Long id) {
        return lessonRepository.findById(id).map(lessonMapper::toDetail);
    }
}
