package com.bucha.service;

import com.bucha.dto.response.LessonSummaryResponse;
import com.bucha.dto.response.LessonDetailResponse;
import com.bucha.entity.Lesson;
import com.bucha.enums.ErrorCode;
import com.bucha.exception.AppException;
import com.bucha.repository.LessonRepository;
import com.bucha.mapper.LessonMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;

    @Transactional(readOnly = true)
    public List<LessonSummaryResponse> list(String level) {
        List<Lesson> lessons = (level == null) ? lessonRepository.findAll() : lessonRepository.findByLevel(level);
        return lessons.stream().map(lessonMapper::toSummary).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LessonDetailResponse get(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
        return lessonMapper.toDetail(lesson);
    }

    // Mapping moved to LessonMapper (MapStruct)
}
