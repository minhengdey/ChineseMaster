package com.bucha.repository;

import com.bucha.entity.Curriculum;
import com.bucha.entity.Lesson;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
   Optional<Curriculum> findByName(String name);

   Optional<Curriculum> findByOrder(Integer order);

   Optional<Curriculum> findByNameAndOrder(String name, Integer order);

   Optional<Curriculum> findById(Long id);

   Optional<Curriculum> findByExternalId(Long externalId);
}