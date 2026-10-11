package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HSKKQuestionsByPartDto {
    private List<HSKKQuestionDto> part1;
    private List<HSKKQuestionDto> part2;
    private List<HSKKQuestionDto> part3;
}
