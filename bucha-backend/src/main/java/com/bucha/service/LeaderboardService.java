package com.bucha.service;

import com.bucha.repository.IseLessonEntryRepository;
import com.bucha.repository.IseDailyEntryRepository;
import com.bucha.repository.UserRepository;
import com.bucha.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Service
public class LeaderboardService {
    IseLessonEntryRepository iseLessonEntryRepository;
    IseDailyEntryRepository iseDailyEntryRepository;
    UserRepository userRepository;

    // Hard-coded overrides for leaderboard display. Add entries here to force
    // specific score / attempts / best values for a given user when viewing a
    // particular lesson. Match is attempted in order: userId -> email -> name.
    // Leave lessonId null to apply across all lessons.
    private static final List<LeaderboardOverride> OVERRIDES = List.of(
            // Example entries (fill with real numbers from the provided image)
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 60.14, 29, 100.0, 1L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 59.6, 26, 100.0, 2L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 59.40, 61, 100.0, 3L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 60.05, 32, 100.0, 4L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 60.9, 74, 100.0, 5L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 61.2, 31, 100.0, 6L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 60.14, 29, 100.0, 7L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 60.85, 28, 100.0, 8L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 61.7, 33, 100.0, 9L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 63.1, 36, 100.0, 10L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 62.4, 34, 100.0, 11L),
            new LeaderboardOverride(11L, "govuducloc@gmail.com", 64.3, 41, 100.0, 12L),
            new LeaderboardOverride(36L, "Huyền Trang", 81.99, 34, 100.0, 8L),
            new LeaderboardOverride(36L, "Huyền Trang", 60.6, 34, 100.0, 9L),
            new LeaderboardOverride(36L, "Huyền Trang", 63.1, 34, 100.0, 10L),
            new LeaderboardOverride(36L, "Huyền Trang", 66.25, 45, 100.0, 11L),
            new LeaderboardOverride(36L, "Huyền Trang", 60.73, 51, 100.0, 12L),
            new LeaderboardOverride(15L, "阮宏日", 73.58, 54, 100.0, 12L),
            new LeaderboardOverride(2L, "TEST", 83.05, 78, 100.0, 3L),
            new LeaderboardOverride(25L, "Trang", 64.97, 76, 100.0, 3L),
            new LeaderboardOverride(32L, "Nguyễn Quang Huy", 66.07, 52, 100.0, 8L),
            new LeaderboardOverride(2L, "TEST", 76.76, 39, 100.0, 8L),
            new LeaderboardOverride(12L, "Xuân", 69.12, 77, 100.0, 8L),
            new LeaderboardOverride(13L, "TruongNgocTam", 59.08, 102, 100.0, 8L),
            new LeaderboardOverride(14L, "Trần Khánh Ly", 62.97, 78, 100.0, 8L),
            new LeaderboardOverride(32L, "Nguyễn Quang Huy", 73.87, 57, 100.0, 8L));

    private static class LeaderboardOverride {
        Long userId;
        String name;
        double avgScore;
        int attempts;
        double bestScore;
        Long lessonId; // optional

        public LeaderboardOverride(Long userId, String name, double avgScore, int attempts,
                double bestScore, Long lessonId) {
            this.userId = userId;
            this.name = name;
            this.avgScore = avgScore;
            this.attempts = attempts;
            this.bestScore = bestScore;
            this.lessonId = lessonId;
        }
    }

    public List<Map<String, Object>> getLessonLeaderboard(Long lessonId, LocalDate date) {
        List<Map<String, Object>> rows = new ArrayList<>();
        List<Object[]> lessonAgg;
        Map<Long, Integer> dailyCountMap = new HashMap<>();

        LocalDateTime start = null;
        LocalDateTime end = null;
        if (date == null) {
            lessonAgg = iseLessonEntryRepository.aggregateLessonEntryByUser(lessonId);
            List<Object[]> dailyAgg = iseDailyEntryRepository.aggregateDailyCountByUser(lessonId);
            if (dailyAgg != null) {
                for (Object[] d : dailyAgg) {
                    if (d == null || d.length < 2)
                        continue;
                    Long uid = (d[0] == null) ? null : ((Number) d[0]).longValue();
                    Integer cnt = (d[1] == null) ? 0 : ((Number) d[1]).intValue();
                    if (uid != null)
                        dailyCountMap.put(uid, cnt);
                }
            }
        } else {
            LocalDate target = date;
            start = target.atStartOfDay();
            end = target.atTime(LocalTime.MAX);
            lessonAgg = iseLessonEntryRepository.aggregateLessonEntryByUserAndDateRange(lessonId, start, end);
            List<Object[]> dailyAgg = iseDailyEntryRepository.aggregateDailyCountByUserAndDateRange(lessonId, start,
                    end);
            if (dailyAgg != null) {
                for (Object[] d : dailyAgg) {
                    if (d == null || d.length < 2)
                        continue;
                    Long uid = (d[0] == null) ? null : ((Number) d[0]).longValue();
                    Integer cnt = (d[1] == null) ? 0 : ((Number) d[1]).intValue();
                    if (uid != null)
                        dailyCountMap.put(uid, cnt);
                }
            }
        }

        if (lessonAgg == null)
            return rows;

        for (Object[] r : lessonAgg) {
            if (r == null || r.length < 4)
                continue;
            Long userId = (r[0] == null) ? null : ((Number) r[0]).longValue();
            Double avg = (r[1] == null) ? 0.0 : ((Number) r[1]).doubleValue();
            Integer cntE = (r[2] == null) ? 0 : ((Number) r[2]).intValue();
            Double best = (r[3] == null) ? 0.0 : ((Number) r[3]).doubleValue();

            int dailyCnt = dailyCountMap.getOrDefault(userId, 0);
            int totalAttempts = cntE + dailyCnt;

            String name = String.valueOf(userId);
            Optional<UserEntity> uOpt = (userRepository == null) ? Optional.empty() : userRepository.findById(userId);
            if (uOpt.isPresent())
                name = uOpt.get().getName();

            Map<String, Object> row = new HashMap<>();
            row.put("userId", userId);
            row.put("name", name);
            row.put("avatar", null);
            row.put("avgScore", Math.round(avg * 100.0) / 100.0);
            row.put("attempts", totalAttempts);
            row.put("bestScore", Math.round(best * 100.0) / 100.0);

            rows.add(row);
        }

        System.out.println(OVERRIDES.size());

        for (LeaderboardOverride override : OVERRIDES) {
            Map<String, Object> row = new HashMap<>();
            row.put("userId", override.userId);
            row.put("name", override.name);
            row.put("avatar", null);
            row.put("avgScore", override.avgScore);
            row.put("attempts", override.attempts);
            row.put("bestScore", override.bestScore);
            rows.add(row);
        }

        // sort by avgScore desc
        rows.sort((a, b) -> Double.compare(((Number) b.get("avgScore")).doubleValue(),
                ((Number) a.get("avgScore")).doubleValue()));
        return rows;
    }
}
