package com.bucha.controller;

import com.bucha.dto.UserProfileDto;
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
    public ResponseEntity<UserProfileDto> getProfile(@AuthenticationPrincipal JwtUserPrincipal principal) {
        var u = userService.findById(principal.id()).orElseThrow();
        return ResponseEntity.ok(toDto(u));
    }

    @PostMapping
    public ResponseEntity<UserProfileDto> updateProfile(@AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestBody UserProfileDto patch) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("auth=" + auth); // hoặc logger
        var u = userService.findById(principal.id()).orElseThrow();
        if (patch.name != null)
            u.setName(patch.name);
        u.setDarkMode(patch.darkMode);
        u.setXp(patch.xp);
        u.setStreak(patch.streak);
        userService.save(u);
        return ResponseEntity.ok(toDto(u));
    }

    private UserProfileDto toDto(com.bucha.entity.UserEntity u) {
        UserProfileDto dto = new UserProfileDto();
        dto.id = u.getId();
        dto.email = u.getEmail();
        dto.name = u.getName();
        dto.xp = u.getXp();
        dto.streak = u.getStreak();
        dto.darkMode = u.isDarkMode();
        dto.badges = u.getBadges();
        return dto;
    }

}
