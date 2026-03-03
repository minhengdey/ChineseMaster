package com.bucha.repository;

import com.bucha.entity.UserLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserLessonRepository extends JpaRepository<UserLesson, Long> {

    @Query("SELECT ul FROM UserLesson ul WHERE ul.user.id = :userId")
    List<UserLesson> findByUser_Id(@Param("userId") Long userId);

    @Query("SELECT ul FROM UserLesson ul WHERE ul.lesson.id = :lessonId")
    List<UserLesson> findByLesson_Id(@Param("lessonId") Long lessonId);

    @Query("SELECT ul FROM UserLesson ul WHERE ul.user.id = :userId AND ul.lesson.id = :lessonId")
    Optional<UserLesson> findByUser_IdAndLesson_Id(@Param("userId") Long userId, @Param("lessonId") Long lessonId);
}
