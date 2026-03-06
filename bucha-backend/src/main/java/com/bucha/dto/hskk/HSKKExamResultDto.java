package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HSKKExamResultDto {
    private Long id;
    private Double totalScore;
    private Double part1Score;
    private Double part2Score;
    private Double part3Score;
    private LocalDateTime createdAt;
}
