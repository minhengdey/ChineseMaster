package com.bucha.repository;

import com.bucha.entity.UserEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    @Query("SELECT u FROM UserEntity u WHERE u.email = :email")
    Optional<UserEntity> findByEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserEntity u WHERE u.role = :role")
    boolean existsByRole(@Param("role") String role);

    @Query("SELECT u FROM UserEntity u WHERE u.role = :role")
    List<UserEntity> findByRole(@Param("role") String role, Pageable pageable);

    default Optional<UserEntity> findFirstByRole(String role) {
        List<UserEntity> list = findByRole(role, PageRequest.of(0, 1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
