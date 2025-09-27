package com.bucha.dto.content;

import lombok.Data;

@Data
public class CurriculumDto {
    private Long id;
    private String name;
    private String description;
    private String level;
}