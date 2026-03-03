package com.bucha.dto.ise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardRowDto {
    private Long userId;
    private String name;
    private Object avatar;
    private double avgScore;
    private long completionCount;
    private Double bestScore;
    private double improvementRate;
    private Object timestamp;
}
