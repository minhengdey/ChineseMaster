package com.bucha.repository;

import com.bucha.entity.Curriculum;
import com.bucha.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    @Query("SELECT l FROM Lesson l WHERE l.level = :level ORDER BY l.curriculum.id, l.order")
    List<Lesson> findByLevel(@Param("level") String level);

    @Query("SELECT l FROM Lesson l WHERE l.title = :title")
    Optional<Lesson> findByTitle(@Param("title") String title);

    @Query("SELECT l FROM Lesson l WHERE l.curriculum.id = :curriculumId ORDER BY l.order")
    List<Lesson> findByCurriculumIdOrderByOrder(@Param("curriculumId") Long curriculumId);

    @Query("SELECT l FROM Lesson l WHERE l.curriculum = :curriculum AND l.order = :order")
    Optional<Lesson> findByCurriculumAndOrder(@Param("curriculum") Curriculum curriculum, @Param("order") Integer order);

    @Query("SELECT l FROM Lesson l WHERE l.externalId = :externalId")
    Optional<Lesson> findByExternalId(@Param("externalId") Long externalId);

    @Query("SELECT l.curriculum.id, COUNT(l) FROM Lesson l GROUP BY l.curriculum.id")
    List<Object[]> countGroupByCurriculumId();
}
