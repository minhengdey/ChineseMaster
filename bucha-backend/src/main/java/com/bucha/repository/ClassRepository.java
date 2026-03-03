package com.bucha.repository;

import com.bucha.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ClassEntity
 */
@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    @Query("SELECT c FROM ClassEntity c WHERE c.name = :name")
    Optional<ClassEntity> findByName(@Param("name") String name);

    /**
     * Find all classes with member count
     */
    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.members")
    List<ClassEntity> findAllWithMembers();

    /**
     * Find class by ID with members loaded
     */
    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.members WHERE c.id = :id")
    Optional<ClassEntity> findByIdWithMembers(@Param("id") Long id);

    /**
     * Check if a class name already exists (case-insensitive)
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM ClassEntity c WHERE LOWER(c.name) = LOWER(:name)")
    boolean existsByNameIgnoreCase(@Param("name") String name);

    /**
     * Check if a class name exists for a different class ID (for update validation)
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM ClassEntity c WHERE LOWER(c.name) = LOWER(:name) AND c.id != :id")
    boolean existsByNameIgnoreCaseAndIdNot(@Param("name") String name, @Param("id") Long id);

    @Query("SELECT c FROM ClassEntity c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<ClassEntity> findByNameContainingIgnoreCase(@Param("name") String name);
}
