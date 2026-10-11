package com.bucha.dto.admin;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for admin user list/detail. Used by UserMapper and admin API.
 */
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
