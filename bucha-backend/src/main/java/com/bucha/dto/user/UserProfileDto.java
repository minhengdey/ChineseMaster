package com.bucha.dto.user;

import java.util.Set;

/**
 * Profile DTO for user API (GET/PATCH /api/profile).
 */
public class UserProfileDto {
    public Long id;
    public String email;
    public String name;
    public String role;
    public String currentPassword;
    public String newPassword;
    public int xp;
    public int streak;
    public boolean darkMode;
    public Set<String> badges;
}
