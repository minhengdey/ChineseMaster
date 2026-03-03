package com.bucha.controller;

import com.bucha.dto.user.UserProfileDto;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserProfileDto> getProfile(@AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.getProfile(principal.id()));
    }

    @PostMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestBody UserProfileDto patch) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(userService.updateProfile(principal.id(), patch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "missing_current_password", "message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403)
                    .body(java.util.Map.of("error", "incorrect_current_password", "message", e.getMessage()));
        }
    }
}
