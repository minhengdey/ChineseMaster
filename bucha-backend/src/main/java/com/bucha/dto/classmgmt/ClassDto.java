package com.bucha.dto.classmgmt;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassDto {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private int memberCount;
    private List<ClassMemberDto> members;
}
