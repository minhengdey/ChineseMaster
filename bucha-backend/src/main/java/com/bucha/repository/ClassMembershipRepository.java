package com.bucha.repository;

import com.bucha.entity.ClassMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ClassMembership
 */
@Repository
public interface ClassMembershipRepository extends JpaRepository<ClassMembership, Long> {

    /**
     * Find all memberships for a specific class
     */
    List<ClassMembership> findByClassEntityId(Long classId);

    /**
     * Find all memberships for a specific user
     */
    List<ClassMembership> findByUserId(Long userId);

    /**
     * Check if a user is already a member of a class
     */
    boolean existsByClassEntityIdAndUserId(Long classId, Long userId);

    /**
     * Find a specific membership by class and user
     */
    Optional<ClassMembership> findByClassEntityIdAndUserId(Long classId, Long userId);

    /**
     * Delete all memberships for a specific class
     */
    void deleteByClassEntityId(Long classId);

    /**
     * Delete a specific membership
     */
    void deleteByClassEntityIdAndUserId(Long classId, Long userId);

    /**
     * Count members in a class
     */
    @Query("SELECT COUNT(cm) FROM ClassMembership cm WHERE cm.classEntity.id = :classId")
    long countByClassId(@Param("classId") Long classId);

    /**
     * Get all class IDs that a user belongs to
     */
    @Query("SELECT cm.classEntity.id FROM ClassMembership cm WHERE cm.user.id = :userId")
    List<Long> findClassIdsByUserId(@Param("userId") Long userId);
}
