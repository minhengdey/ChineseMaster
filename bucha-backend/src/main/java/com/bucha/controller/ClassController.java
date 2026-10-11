package com.bucha.controller;

import com.bucha.dto.classmgmt.ClassDto;
import com.bucha.dto.classmgmt.ClassMemberDto;
import com.bucha.dto.classmgmt.ClassRequests;
import com.bucha.service.ClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class ClassController {

    private final ClassService classService;

    @GetMapping
    public ResponseEntity<List<ClassDto>> getAllClasses() {
        log.info("REST request to get all classes");
        return ResponseEntity.ok(classService.getAllClasses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassDto> getClassById(@PathVariable Long id) {
        log.info("REST request to get class with id: {}", id);
        return ResponseEntity.ok(classService.getClassById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ClassDto>> searchClasses(@RequestParam String name) {
        log.info("REST request to search classes with name: {}", name);
        return ResponseEntity.ok(classService.searchClassesByName(name));
    }

    @PostMapping
    public ResponseEntity<ClassDto> createClass(@Valid @RequestBody ClassRequests.CreateClassRequest request) {
        log.info("REST request to create new class: {}", request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(classService.createClass(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassDto> updateClass(
            @PathVariable Long id,
            @Valid @RequestBody ClassRequests.UpdateClassRequest request) {
        log.info("REST request to update class with id: {}", id);
        return ResponseEntity.ok(classService.updateClass(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable Long id) {
        log.info("REST request to delete class with id: {}", id);
        classService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ClassMemberDto>> getClassMembers(@PathVariable Long id) {
        log.info("REST request to get members of class: {}", id);
        return ResponseEntity.ok(classService.getClassMembers(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ClassDto> addMember(
            @PathVariable Long id,
            @Valid @RequestBody ClassRequests.AddMemberRequest request) {
        log.info("REST request to add user {} to class {}", request.userId(), id);
        return ResponseEntity.ok(classService.addMember(id, request));
    }

    @PostMapping("/{id}/members/bulk")
    public ResponseEntity<ClassDto> addMultipleMembers(
            @PathVariable Long id,
            @Valid @RequestBody ClassRequests.AddMultipleMembersRequest request) {
        log.info("REST request to add {} users to class {}", request.userIds().length, id);
        return ResponseEntity.ok(classService.addMultipleMembers(id, request));
    }

    @DeleteMapping("/{classId}/members/{userId}")
    public ResponseEntity<ClassDto> removeMember(
            @PathVariable Long classId,
            @PathVariable Long userId) {
        log.info("REST request to remove user {} from class {}", userId, classId);
        return ResponseEntity.ok(classService.removeMember(classId, userId));
    }
}
