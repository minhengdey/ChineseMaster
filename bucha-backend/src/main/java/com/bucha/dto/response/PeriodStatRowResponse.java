package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PeriodStatRowResponse {
    String periodStart; // ISO date string (day start or week start)
    Double avgScore;
    Integer count;
    Long durationSeconds;
}
