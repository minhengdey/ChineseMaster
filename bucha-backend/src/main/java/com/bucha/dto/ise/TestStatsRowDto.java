package com.bucha.dto.ise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestStatsRowDto {
    private Long testId;
    private double avgTotal;
    private int attempts;
    private List<TestStatsEntryDto> entries;
}
