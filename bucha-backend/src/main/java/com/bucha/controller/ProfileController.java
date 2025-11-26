package com.bucha.controller;

import com.bucha.dto.request.UserProfileUpdateRequest;
import com.bucha.dto.response.UserProfileResponse;
// import com.bucha.entity.User; // Removed unused import
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(principal.id()));
    }

    @PostMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestBody UserProfileUpdateRequest patch) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("auth=" + auth); // hoặc logger
        var resp = userService.updateProfile(principal.id(), patch);
        return ResponseEntity.ok(resp);
    }

}
