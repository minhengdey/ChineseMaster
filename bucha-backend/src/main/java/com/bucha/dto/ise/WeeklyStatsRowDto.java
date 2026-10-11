package com.bucha.dto.ise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyStatsRowDto {
    private String weekStart;
    private double avgScore;
    private int count;
    private long durationSeconds;
}
