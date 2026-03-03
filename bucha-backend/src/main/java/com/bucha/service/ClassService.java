package com.bucha.service;

import com.bucha.dto.classmgmt.ClassDto;
import com.bucha.dto.classmgmt.ClassMemberDto;
import com.bucha.dto.classmgmt.ClassRequests;
import com.bucha.entity.ClassEntity;
import com.bucha.entity.ClassMembership;
import com.bucha.entity.UserEntity;
import com.bucha.repository.ClassMembershipRepository;
import com.bucha.repository.ClassRepository;
import com.bucha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Class management
 * Handles business logic for class CRUD operations and member management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClassService {

    private final ClassRepository classRepository;
    private final ClassMembershipRepository classMembershipRepository;
    private final UserRepository userRepository;

    /**
     * Get all classes with their members
     */
    @Transactional(readOnly = true)
    public List<ClassDto> getAllClasses() {
        log.info("Fetching all classes");
        List<ClassEntity> classes = classRepository.findAll();
        return classes.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get a single class by ID
     */
    @Transactional(readOnly = true)
    public ClassDto getClassById(Long classId) {
        log.info("Fetching class with id: {}", classId);
        ClassEntity classEntity = findClassByIdOrThrow(classId);
        return mapToDto(classEntity);
    }

    /**
     * Create a new class
     */
    @Transactional
    public ClassDto createClass(ClassRequests.CreateClassRequest request) {
        log.info("Creating new class with name: {}", request.name());

        // Validate class name uniqueness
        if (classRepository.existsByNameIgnoreCase(request.name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tên lớp học đã tồn tại");
        }

        ClassEntity classEntity = ClassEntity.builder()
                .name(request.name().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .members(new ArrayList<>())
                .build();

        classEntity = classRepository.save(classEntity);
        log.info("Successfully created class with id: {}", classEntity.getId());

        return mapToDto(classEntity);
    }

    /**
     * Update an existing class
     */
    @Transactional
    public ClassDto updateClass(Long classId, ClassRequests.UpdateClassRequest request) {
        log.info("Updating class with id: {}", classId);

        ClassEntity classEntity = findClassByIdOrThrow(classId);

        // Update name if provided
        if (request.name() != null && !request.name().isBlank()) {
            String trimmedName = request.name().trim();

            // Check if new name conflicts with existing class
            if (classRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, classId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Tên lớp học đã được sử dụng bởi lớp khác");
            }

            classEntity.setName(trimmedName);
        }

        // Update description if provided
        if (request.description() != null) {
            classEntity.setDescription(request.description().trim());
        }

        classEntity = classRepository.save(classEntity);
        log.info("Successfully updated class with id: {}", classId);

        return mapToDto(classEntity);
    }

    /**
     * Delete a class
     */
    @Transactional
    public void deleteClass(Long classId) {
        log.info("Deleting class with id: {}", classId);

        ClassEntity classEntity = findClassByIdOrThrow(classId);

        // Delete all memberships first (cascade should handle this, but being explicit)
        classMembershipRepository.deleteByClassEntityId(classId);

        // Delete the class
        classRepository.delete(classEntity);

        log.info("Successfully deleted class with id: {}", classId);
    }

    /**
     * Add a member to a class
     */
    @Transactional
    public ClassDto addMember(Long classId, ClassRequests.AddMemberRequest request) {
        log.info("Adding user {} to class {}", request.userId(), classId);

        ClassEntity classEntity = findClassByIdOrThrow(classId);
        UserEntity user = findUserByIdOrThrow(request.userId());

        // Check if user is already a member
        if (classMembershipRepository.existsByClassEntityIdAndUserId(classId, request.userId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Người dùng đã là thành viên của lớp này");
        }

        // Create membership
        ClassMembership membership = ClassMembership.builder()
                .classEntity(classEntity)
                .user(user)
                .build();

        classMembershipRepository.save(membership);
        log.info("Successfully added user {} to class {}", request.userId(), classId);

        // Refresh and return updated class
        classEntity = findClassByIdOrThrow(classId);
        return mapToDto(classEntity);
    }

    /**
     * Add multiple members to a class
     */
    @Transactional
    public ClassDto addMultipleMembers(Long classId, ClassRequests.AddMultipleMembersRequest request) {
        log.info("Adding {} users to class {}", request.userIds().length, classId);

        ClassEntity classEntity = findClassByIdOrThrow(classId);

        int addedCount = 0;
        int skippedCount = 0;

        for (Long userId : request.userIds()) {
            // Check if user exists
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("User {} not found, skipping", userId);
                skippedCount++;
                continue;
            }

            // Check if already a member
            if (classMembershipRepository.existsByClassEntityIdAndUserId(classId, userId)) {
                log.debug("User {} already a member of class {}, skipping", userId, classId);
                skippedCount++;
                continue;
            }

            // Create membership
            ClassMembership membership = ClassMembership.builder()
                    .classEntity(classEntity)
                    .user(user)
                    .build();

            classMembershipRepository.save(membership);
            addedCount++;
        }

        log.info("Added {} users to class {}. Skipped: {}", addedCount, classId, skippedCount);

        // Refresh and return updated class
        classEntity = findClassByIdOrThrow(classId);
        return mapToDto(classEntity);
    }

    /**
     * Remove a member from a class
     */
    @Transactional
    public ClassDto removeMember(Long classId, Long userId) {
        log.info("Removing user {} from class {}", userId, classId);

        ClassEntity classEntity = findClassByIdOrThrow(classId);

        // Check if membership exists
        if (!classMembershipRepository.existsByClassEntityIdAndUserId(classId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Người dùng không phải là thành viên của lớp này");
        }

        // Delete membership
        classMembershipRepository.deleteByClassEntityIdAndUserId(classId, userId);
        log.info("Successfully removed user {} from class {}", userId, classId);

        // Refresh and return updated class
        classEntity = findClassByIdOrThrow(classId);
        return mapToDto(classEntity);
    }

    /**
     * Get all members of a class
     */
    @Transactional(readOnly = true)
    public List<ClassMemberDto> getClassMembers(Long classId) {
        log.info("Fetching members of class {}", classId);

        // Verify class exists
        findClassByIdOrThrow(classId);

        List<ClassMembership> memberships = classMembershipRepository.findByClassEntityId(classId);

        return memberships.stream()
                .map(membership -> mapUserToMemberDto(membership.getUser()))
                .collect(Collectors.toList());
    }

    /**
     * Search classes by name
     */
    @Transactional(readOnly = true)
    public List<ClassDto> searchClassesByName(String name) {
        log.info("Searching classes with name containing: {}", name);

        List<ClassEntity> classes = classRepository.findByNameContainingIgnoreCase(name);

        return classes.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ===========================
    // Helper Methods
    // ===========================

    /**
     * Find class by ID or throw exception
     */
    private ClassEntity findClassByIdOrThrow(Long classId) {
        return classRepository.findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy lớp học với ID: " + classId));
    }

    /**
     * Find user by ID or throw exception
     */
    private UserEntity findUserByIdOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng với ID: " + userId));
    }

    /**
     * Map ClassEntity to ClassDto
     */
    private ClassDto mapToDto(ClassEntity entity) {
        // Get fresh member list
        List<ClassMembership> memberships = classMembershipRepository.findByClassEntityId(entity.getId());

        List<ClassMemberDto> members = memberships.stream()
                .map(membership -> mapUserToMemberDto(membership.getUser()))
                .collect(Collectors.toList());

        return ClassDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .memberCount(members.size())
                .members(members)
                .build();
    }

    /**
     * Map UserEntity to ClassMemberDto
     */
    private ClassMemberDto mapUserToMemberDto(UserEntity user) {
        return ClassMemberDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .xp(user.getXp())
                .streak(user.getStreak())
                .build();
    }
}
