package com.bucha.dto;

import java.util.Set;

public class UserProfileDto {
    public Long id;
    public String email;
    public String name;
    // optional fields for update requests
    public String currentPassword;
    public String newPassword;
    public int xp;
    public int streak;
    public boolean darkMode;
    public Set<String> badges;
}
