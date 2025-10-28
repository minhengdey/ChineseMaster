package com.bucha.repository;

import com.bucha.entity.UserLesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserLessonRepository extends JpaRepository<UserLesson, Long> {
    List<UserLesson> findByUser_Id(Long userId);

    List<UserLesson> findByLesson_Id(Long lessonId);

    Optional<UserLesson> findByUser_IdAndLesson_Id(Long userId, Long lessonId);
}
