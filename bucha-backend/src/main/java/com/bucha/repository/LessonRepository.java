package com.bucha.repository;

import com.bucha.entity.Curriculum;
import com.bucha.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByLevel(String level);

    Optional<Lesson> findByTitle(String title);

    List<Lesson> findByCurriculumIdOrderByOrder(Long curriculumId);

    Optional<Lesson> findByCurriculumAndOrder(Curriculum curriculum, Integer order);

    Optional<Lesson> findByExternalId(Long externalId);

}
