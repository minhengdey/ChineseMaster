package com.bucha.controller;

import com.bucha.dto.ClassDto;
import com.bucha.dto.ClassMemberDto;
import com.bucha.dto.ClassRequests;
import com.bucha.service.ClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Class Management (Admin only)
 * Handles HTTP requests for class CRUD operations and member management
 */
@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class ClassController {

    private final ClassService classService;

    /**
     * GET /api/admin/classes
     * Get all classes
     */
    @GetMapping
    public ResponseEntity<List<ClassDto>> getAllClasses() {
        log.info("REST request to get all classes");
        List<ClassDto> classes = classService.getAllClasses();
        return ResponseEntity.ok(classes);
    }

    /**
     * GET /api/admin/classes/{id}
     * Get a single class by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClassDto> getClassById(@PathVariable Long id) {
        log.info("REST request to get class with id: {}", id);
        ClassDto classDto = classService.getClassById(id);
        return ResponseEntity.ok(classDto);
    }

    /**
     * GET /api/admin/classes/search?name={name}
     * Search classes by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<ClassDto>> searchClasses(@RequestParam String name) {
        log.info("REST request to search classes with name: {}", name);
        List<ClassDto> classes = classService.searchClassesByName(name);
        return ResponseEntity.ok(classes);
    }

    /**
     * POST /api/admin/classes
     * Create a new class
     */
    @PostMapping
    public ResponseEntity<ClassDto> createClass(@Valid @RequestBody ClassRequests.CreateClassRequest request) {
        log.info("REST request to create new class: {}", request.name());
        ClassDto createdClass = classService.createClass(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClass);
    }

    /**
     * PUT /api/admin/classes/{id}
     * Update an existing class
     */
    @PutMapping("/{id}")
    public ResponseEntity<ClassDto> updateClass(
            @PathVariable Long id,
            @Valid @RequestBody ClassRequests.UpdateClassRequest request) {
        log.info("REST request to update class with id: {}", id);
        ClassDto updatedClass = classService.updateClass(id, request);
        return ResponseEntity.ok(updatedClass);
    }

    /**
     * DELETE /api/admin/classes/{id}
     * Delete a class
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable Long id) {
        log.info("REST request to delete class with id: {}", id);
        classService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/admin/classes/{id}/members
     * Get all members of a class
     */
    @GetMapping("/{id}/members")
    public ResponseEntity<List<ClassMemberDto>> getClassMembers(@PathVariable Long id) {
        log.info("REST request to get members of class: {}", id);
        List<ClassMemberDto> members = classService.getClassMembers(id);
        return ResponseEntity.ok(members);
    }

    /**
     * POST /api/admin/classes/{id}/members
     * Add a member to a class
     */
    @PostMapping("/{id}/members")
    public ResponseEntity<ClassDto> addMember(
            @PathVariable Long id,
            @Valid @RequestBody ClassRequests.AddMemberRequest request) {
        log.info("REST request to add user {} to class {}", request.userId(), id);
        ClassDto updatedClass = classService.addMember(id, request);
        return ResponseEntity.ok(updatedClass);
    }

    /**
     * POST /api/admin/classes/{id}/members/bulk
     * Add multiple members to a class
     */
    @PostMapping("/{id}/members/bulk")
    public ResponseEntity<ClassDto> addMultipleMembers(
            @PathVariable Long id,
            @Valid @RequestBody ClassRequests.AddMultipleMembersRequest request) {
        log.info("REST request to add {} users to class {}", request.userIds().length, id);
        ClassDto updatedClass = classService.addMultipleMembers(id, request);
        return ResponseEntity.ok(updatedClass);
    }

    /**
     * DELETE /api/admin/classes/{classId}/members/{userId}
     * Remove a member from a class
     */
    @DeleteMapping("/{classId}/members/{userId}")
    public ResponseEntity<ClassDto> removeMember(
            @PathVariable Long classId,
            @PathVariable Long userId) {
        log.info("REST request to remove user {} from class {}", userId, classId);
        ClassDto updatedClass = classService.removeMember(classId, userId);
        return ResponseEntity.ok(updatedClass);
    }
}
