package com.bucha.repository;

import com.bucha.entity.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {

   @Query("SELECT c FROM Curriculum c WHERE c.name = :name")
   Optional<Curriculum> findByName(@Param("name") String name);

   @Query("SELECT c FROM Curriculum c WHERE c.order = :order")
   Optional<Curriculum> findByOrder(@Param("order") Integer order);

   @Query("SELECT c FROM Curriculum c WHERE c.name = :name AND c.order = :order")
   Optional<Curriculum> findByNameAndOrder(@Param("name") String name, @Param("order") Integer order);

   @Query("SELECT c FROM Curriculum c WHERE c.externalId = :externalId")
   Optional<Curriculum> findByExternalId(@Param("externalId") Long externalId);

   @Query("SELECT c FROM Curriculum c ORDER BY c.order, c.id")
   @Override
   List<Curriculum> findAll();
}