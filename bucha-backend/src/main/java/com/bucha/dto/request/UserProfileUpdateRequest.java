package com.bucha.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileUpdateRequest {
    String email;
    String name;
    String currentPassword;
    String newPassword;
    Integer xp;
    Integer streak;
    Boolean darkMode;
    Set<String> badges;
}
