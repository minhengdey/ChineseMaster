package com.bucha.dto.content;

import lombok.Data;

@Data
public class LessonDto {
    private Long id;
    private String title;
    private Integer order;
    private String level;
}