package com.bucha.controller;

import com.bucha.dto.AdminUserDto;
import com.bucha.dto.AdminUserRequests;
import com.bucha.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<?> listUsers() {
        List<AdminUserDto> users = adminUserService.list();
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<AdminUserDto> create(@RequestBody @Valid AdminUserRequests.Create req) {
        return ResponseEntity.ok(adminUserService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminUserDto> update(@PathVariable Long id,
            @RequestBody @Valid AdminUserRequests.Update req) {
        return ResponseEntity.ok(adminUserService.update(id, req));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<AdminUserDto> updateRole(@PathVariable Long id,
            @RequestBody @Valid AdminUserRequests.RoleUpdate req) {
        return ResponseEntity.ok(adminUserService.updateRole(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminUserService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
