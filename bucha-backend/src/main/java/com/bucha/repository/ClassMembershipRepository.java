package com.bucha.repository;

import com.bucha.entity.ClassMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Query("SELECT cm FROM ClassMembership cm WHERE cm.classEntity.id = :classId")
    List<ClassMembership> findByClassEntityId(@Param("classId") Long classId);

    @Query("SELECT cm FROM ClassMembership cm WHERE cm.user.id = :userId")
    List<ClassMembership> findByUserId(@Param("userId") Long userId);

    @Query("SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END FROM ClassMembership cm WHERE cm.classEntity.id = :classId AND cm.user.id = :userId")
    boolean existsByClassEntityIdAndUserId(@Param("classId") Long classId, @Param("userId") Long userId);

    @Query("SELECT cm FROM ClassMembership cm WHERE cm.classEntity.id = :classId AND cm.user.id = :userId")
    Optional<ClassMembership> findByClassEntityIdAndUserId(@Param("classId") Long classId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM ClassMembership cm WHERE cm.classEntity.id = :classId")
    void deleteByClassEntityId(@Param("classId") Long classId);

    @Modifying
    @Query("DELETE FROM ClassMembership cm WHERE cm.classEntity.id = :classId AND cm.user.id = :userId")
    void deleteByClassEntityIdAndUserId(@Param("classId") Long classId, @Param("userId") Long userId);

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
