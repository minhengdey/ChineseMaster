package com.bucha.mapper;

import com.bucha.dto.admin.AdminUserDto;
import com.bucha.dto.user.UserProfileDto;
import com.bucha.entity.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserProfileDto toProfileDto(UserEntity entity) {
        if (entity == null) return null;
        UserProfileDto dto = new UserProfileDto();
        dto.id = entity.getId();
        dto.email = entity.getEmail();
        dto.name = entity.getName();
        dto.role = entity.getRole();
        dto.xp = entity.getXp();
        dto.streak = entity.getStreak();
        dto.darkMode = entity.isDarkMode();
        dto.badges = entity.getBadges();
        return dto;
    }

    public AdminUserDto toAdminUserDto(UserEntity entity) {
        if (entity == null) return null;
        return new AdminUserDto(
                entity.getId(),
                entity.getEmail(),
                entity.getName(),
                entity.getRole(),
                entity.getXp(),
                entity.getStreak(),
                entity.isDarkMode(),
                entity.getBadges(),
                entity.getCreatedAt());
    }
}
