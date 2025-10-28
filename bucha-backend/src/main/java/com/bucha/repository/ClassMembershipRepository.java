package com.bucha.repository;

import com.bucha.entity.ClassMembership;
import com.bucha.entity.ClassEntity;
import com.bucha.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassMembershipRepository extends JpaRepository<ClassMembership, Long> {
    List<ClassMembership> findByAClass_Id(Long classId);

    List<ClassMembership> findByUser_Id(Long userId);

    Optional<ClassMembership> findByAClass_IdAndUser_Id(Long classId, Long userId);
}
