package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LeaderboardRowResponse {
    Long userId; // user or lesson identifier depending on context
    String name; // optional display name
    String avatar; // optional avatar url
    Double bestScore; // highest score (lesson leaderboard)
    Double avgScore; // average score over period
    Integer attempts; // number of attempts (lesson)
    Long completionCount; // number of completions (daily/weekly)
    Double improvementRate; // improvement metric vs previous period
    LocalDateTime timestamp; // representative timestamp (earliest attempt)
}
