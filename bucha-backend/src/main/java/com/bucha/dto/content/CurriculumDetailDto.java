package com.bucha.dto.content;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class CurriculumDetailDto extends CurriculumDto {
    private List<LessonDto> lessons;
}