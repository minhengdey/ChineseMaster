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

        // sort by avgScore desc
        rows.sort((a, b) -> Double.compare(((Number) b.get("avgScore")).doubleValue(),
                ((Number) a.get("avgScore")).doubleValue()));
        return rows;
    }
}
