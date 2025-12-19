package com.bucha.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Class response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassDto {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private Integer memberCount;
    private List<ClassMemberDto> members;
}
