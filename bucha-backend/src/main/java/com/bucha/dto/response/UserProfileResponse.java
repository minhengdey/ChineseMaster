package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileResponse {
    Long id;
    String email;
    String name;
    Integer xp;
    Integer streak;
    Boolean darkMode;
    Set<String> badges;
}
