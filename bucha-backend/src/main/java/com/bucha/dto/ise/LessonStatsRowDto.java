package com.bucha.dto.ise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonStatsRowDto {
    private Long lessonId;
    private double avgScore;
    private boolean completedFull;
    private double award;
    private double lessonScore;
}
