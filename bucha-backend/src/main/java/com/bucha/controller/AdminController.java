package com.bucha.controller;

import com.bucha.dto.UserProfileDto;
import com.bucha.entity.UserEntity;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.UserService;
import com.bucha.service.ClassService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lightweight admin controller for basic user listing and admin-only
 * operations.
 * Protected via method-level security (@PreAuthorize). Add more admin endpoints
 * here
 * as needed by the admin dashboard.
 */
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    UserService userService;
    ClassService classService;
    // class management endpoints implemented below

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> listUsers(@AuthenticationPrincipal JwtUserPrincipal principal) {
        List<UserEntity> users = userService.findAll();
        List<UserProfileDto> dtos = users.stream().map(u -> {
            UserProfileDto d = new UserProfileDto();
            d.id = u.getId();
            d.email = u.getEmail();
            d.name = u.getName();
            d.role = u.getRole();
            d.xp = u.getXp();
            d.streak = u.getStreak();
            d.darkMode = u.isDarkMode();
            d.badges = u.getBadges();
            return d;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
        userService.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    @PostMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeUserRole(@PathVariable("id") Long id,
            @RequestBody java.util.Map<String, String> body) {
        String role = body.get("role");
        if (role == null)
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "role is required"));
        var opt = userService.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        var u = opt.get();
        u.setRole(role);
        userService.save(u);
        return ResponseEntity.ok(Map.of("id", u.getId(), "role", u.getRole()));
    }

    // --- Class management endpoints (create/list classes, add/remove members)
    @GetMapping("/classes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> listClasses() {
        var cls = classService.listClasses();
        // Map to simple DTOs to avoid circular references and simplify frontend usage
        var dtoList = cls.stream().map(c -> {
            var map = new java.util.HashMap<String, Object>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("description", c.getDescription());
            var members = c.getMembers().stream().map(m -> {
                var mm = new java.util.HashMap<String, Object>();
                var u = m.getUser();
                if (u != null) {
                    mm.put("userId", u.getId());
                    mm.put("name", u.getName());
                    mm.put("email", u.getEmail());
                } else {
                    mm.put("userId", null);
                }
                return mm;
            }).collect(java.util.stream.Collectors.toList());
            map.put("members", members);
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    @PostMapping("/classes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createClass(@RequestBody java.util.Map<String, String> body) {
        String name = body.get("name");
        String desc = body.get("description");
        if (name == null || name.isBlank())
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "name_required"));
        var created = classService.createClass(name, desc);
        // return same DTO shape as listClasses
        var map = new java.util.HashMap<String, Object>();
        map.put("id", created.getId());
        map.put("name", created.getName());
        map.put("description", created.getDescription());
        map.put("members", java.util.Collections.emptyList());
        return ResponseEntity.status(201).body(map);
    }

    @PostMapping("/classes/{id}/members")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addMemberToClass(@PathVariable("id") Long classId,
            @RequestBody java.util.Map<String, Object> body) {
        Long userId = null;
        if (body.containsKey("userId")) {
            try {
                userId = Long.valueOf(String.valueOf(body.get("userId")));
            } catch (Exception ignored) {
            }
        }
        if (userId == null && body.containsKey("email")) {
            String email = String.valueOf(body.get("email"));
            var opt = userService.findByEmail(email);
            if (opt.isEmpty())
                return ResponseEntity.status(404).body(java.util.Map.of("error", "user_not_found"));
            userId = opt.get().getId();
        }
        if (userId == null)
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "userId_or_email_required"));
        boolean ok = classService.addUserToClass(classId, userId);
        if (!ok)
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "unable_to_add"));
        return ResponseEntity.ok(java.util.Map.of("added", userId));
    }

    @DeleteMapping("/classes/{id}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeMemberFromClass(@PathVariable("id") Long classId,
            @PathVariable("userId") Long userId) {
        boolean ok = classService.removeUserFromClass(classId, userId);
        if (!ok)
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "unable_to_remove"));
        return ResponseEntity.ok(java.util.Map.of("removed", userId));
    }

    // Simple admin check endpoint (can be used by frontend to verify admin access)
    @GetMapping("/whoami")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> whoami(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(principal);
    }
}
