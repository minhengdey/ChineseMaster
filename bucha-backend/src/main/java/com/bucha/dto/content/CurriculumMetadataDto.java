package com.bucha.dto.content;

import lombok.Data;

import java.util.List;

@Data
public class CurriculumMetadataDto {
    private Long id;
    private String name;
    private String description;
    private String level;
    private Integer order;
    private List<String> lessons;
}
