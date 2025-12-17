package com.bucha.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record AdminUserDto(
        Long id,
        String email,
        String name,
        String role,
        int xp,
        int streak,
        boolean darkMode,
        Set<String> badges,
        LocalDateTime createdAt) {
}
