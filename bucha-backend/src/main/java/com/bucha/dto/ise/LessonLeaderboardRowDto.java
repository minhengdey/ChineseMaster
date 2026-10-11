package com.bucha.dto.ise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonLeaderboardRowDto {
    private Long userId;
    private String name;
    private Object avatar;
    private double avgScore;
    private int attempts;
    private double bestScore;
}
