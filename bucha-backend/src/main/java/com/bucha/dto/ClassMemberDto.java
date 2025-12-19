package com.bucha.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Class Member (simplified user info)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassMemberDto {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private Integer xp;
    private Integer streak;
}
