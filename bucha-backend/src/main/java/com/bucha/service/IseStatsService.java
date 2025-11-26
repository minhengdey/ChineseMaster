package com.bucha.service;

import com.bucha.entity.UserEntity;
import com.bucha.entity.UserLesson;
import com.bucha.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class IseStatsService {
    IseRepository iseRepository;
    IseDailyEntryRepository iseDailyEntryRepository;
    IseLessonEntryRepository iseLessonEntryRepository;
    IseTestEntryRepository iseTestEntryRepository;
    UserLessonRepository userLessonRepository;
    UserService userService;

    static final Logger logger = LoggerFactory.getLogger(IseStatsService.class);

    /**
     * Get daily stats for a user within a date range
     */
    public Map<String, Object> getDailyStats(Long userId, LocalDate from, LocalDate to, Boolean debug) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusDays(29);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        try {
            List<Object[]> queryResults = iseDailyEntryRepository.getDailyStatsGrouped(userId, start, end);

            Map<LocalDate, Map<String, Object>> lookup = new HashMap<>();
            List<Map<String, Object>> sqlRows = new ArrayList<>();

            for (Object[] row : queryResults) {
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate ld = sqlDate.toLocalDate();

                Map<String, Object> r = new HashMap<>();
                r.put("day", ld.toString());
                r.put("avg_score", row[1]);
                r.put("cnt_attempts", row[2]);
                r.put("cnt_rows", row[3]);
                r.put("duration_sum", row[4]);

                lookup.put(ld, r);
                sqlRows.add(r);
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            LocalDate d = startDate;
            while (!d.isAfter(endDate)) {
                Map<String, Object> r = lookup.get(d);
                if (r == null) {
                    Map<String, Object> empty = new HashMap<>();
                    empty.put("date", d.toString());
                    empty.put("avgScore", 0.0);
                    empty.put("count", 0);
                    empty.put("durationSeconds", 0);
                    rows.add(empty);
                } else {
                    Map<String, Object> out = new HashMap<>();
                    out.put("date", d.toString());
                    Number avgNum = (Number) (r.getOrDefault("avg_score", r.get("avgScore")));
                    double avgVal = (avgNum == null) ? 0.0 : avgNum.doubleValue();
                    Number cntAttemptsNum = (Number) (r.getOrDefault("cnt_attempts", r.get("cnt_attempts")));
                    Number cntRowsNum = (Number) (r.getOrDefault("cnt_rows", r.get("cnt_rows")));
                    int cntVal = 0;
                    if (cntAttemptsNum != null)
                        cntVal = cntAttemptsNum.intValue();
                    else if (cntRowsNum != null)
                        cntVal = cntRowsNum.intValue();
                    Number durNum = (Number) (r.getOrDefault("duration_sum", r.get("durationSeconds")));
                    long durVal = (durNum == null) ? 0L : durNum.longValue();
                    out.put("avgScore", Math.round(avgVal * 100.0) / 100.0);
                    out.put("count", cntVal);
                    out.put("durationSeconds", durVal);
                    rows.add(out);
                }
                d = d.plusDays(1);
            }

            if (Boolean.TRUE.equals(debug)) {
                return Map.of("rows", rows, "sqlRows", sqlRows);
            }
            return Map.of("rows", rows);
        } catch (Exception e) {
            logger.debug("failed to compute daily stats by SQL", e);
            throw new RuntimeException("failed to compute daily stats");
        }
    }

    /**
     * Get lesson stats for a user
     */
    public Map<String, Object> getLessonStats(Long userId) {
        List<com.bucha.entity.IseLessonEntry> lessonEntries = iseLessonEntryRepository.findByUser_Id(userId);
        Map<Long, List<com.bucha.entity.IseLessonEntry>> grouped = lessonEntries.stream()
                .filter(e -> e.getLessonId() != null)
                .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getLessonId));

        List<Map<String, Object>> rows = grouped.entrySet().stream().map(e -> {
            Long lessonId = e.getKey();
            List<com.bucha.entity.IseLessonEntry> list = e.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            UserLesson userLesson = userLessonRepository.findByUser_IdAndLesson_Id(userId, lessonId).orElse(null);
            boolean completed = false;
            if (userLesson != null) {
                completed = userLesson.isCompleted();
            }
            double award = completed ? (0.1 * avg) : 0.0;
            double lessonScore = avg + award;
            Map<String, Object> row = new HashMap<>();
            row.put("lessonId", lessonId);
            row.put("avgScore", Math.round(avg * 100.0) / 100.0);
            row.put("completedFull", completed);
            row.put("award", Math.round(award * 100.0) / 100.0);
            row.put("lessonScore", Math.round(lessonScore * 100.0) / 100.0);
            return row;
        }).collect(Collectors.toList());

        return Map.of("rows", rows);
    }

    /**
     * Get test stats for a user
     */
    public Map<String, Object> getTestStats(Long userId) {
        List<com.bucha.entity.IseTestEntry> testEntries = iseTestEntryRepository.findByUser_Id(userId);
        Map<Long, List<com.bucha.entity.IseTestEntry>> grouped = testEntries.stream()
                .filter(e -> e.getTestId() != null)
                .collect(Collectors.groupingBy(com.bucha.entity.IseTestEntry::getTestId));

        List<Map<String, Object>> rows = grouped.entrySet().stream().map(e -> {
            Long testId = e.getKey();
            List<com.bucha.entity.IseTestEntry> list = e.getValue();
            double avgTotal = list.stream()
                    .mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            Map<String, Object> row = new HashMap<>();
            row.put("testId", testId);
            row.put("avgTotal", Math.round(avgTotal * 100.0) / 100.0);
            row.put("attempts", list.size());
            row.put("entries", list.stream().map(s -> Map.of(
                    "id", s.getId(),
                    "totalScore", s.getTotalScore(),
                    "sessionDate", s.getSessionDate() == null ? null : s.getSessionDate().toString()))
                    .collect(Collectors.toList()));
            return row;
        }).collect(Collectors.toList());

        return Map.of("rows", rows);
    }

    /**
     * Get pronounced items for a lesson
     */
    public Map<String, Object> getPronouncedForLesson(Long userId, Long lessonId) {
        if (lessonId == null) {
            throw new IllegalArgumentException("lessonId is required");
        }

        List<Long> lineIds = iseDailyEntryRepository.findDistinctLineIdsByUserAndLesson(userId, lessonId);
        List<Long> vocabIds = iseDailyEntryRepository.findDistinctVocabularyIdsByUserAndLesson(userId, lessonId);

        Map<String, Object> out = new HashMap<>();
        int distinctLineCount = (lineIds == null) ? 0 : lineIds.size();
        int distinctVocabCount = (vocabIds == null) ? 0 : vocabIds.size();
        int pronouncedCount = distinctLineCount + distinctVocabCount;

        List<String> lineIdStrs = (lineIds == null) ? Collections.emptyList()
                : lineIds.stream().map(String::valueOf).collect(Collectors.toList());
        List<String> vocabIdStrs = (vocabIds == null) ? Collections.emptyList()
                : vocabIds.stream().map(String::valueOf).collect(Collectors.toList());
        out.put("lineIds", lineIdStrs);
        out.put("vocabularyIds", vocabIdStrs);
        out.put("distinctLineCount", distinctLineCount);
        out.put("distinctVocabularyCount", distinctVocabCount);
        out.put("pronouncedCount", pronouncedCount);

        try {
            List<com.bucha.entity.IseLessonEntry> lessonEntriesAll = iseLessonEntryRepository
                    .findByUser_IdAndLessonId(userId, lessonId);

            Map<Long, List<com.bucha.entity.IseLessonEntry>> byVocab = lessonEntriesAll.stream()
                    .filter(e -> e.getVocabularyId() != null)
                    .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getVocabularyId));

            Map<Long, List<com.bucha.entity.IseLessonEntry>> byLine = lessonEntriesAll.stream()
                    .filter(e -> e.getLineId() != null)
                    .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getLineId));

            Double avgWordScore = null;
            Double avgSentenceScore = null;

            if (!byVocab.isEmpty()) {
                double sumPerVocabAvg = 0.0;
                int vocabCount = 0;
                for (Map.Entry<Long, List<com.bucha.entity.IseLessonEntry>> ve : byVocab.entrySet()) {
                    List<com.bucha.entity.IseLessonEntry> items = ve.getValue();
                    double avgForThisVocab = items.stream().mapToDouble(
                            it -> Optional.ofNullable(it.getTotalScore()).orElse(0.0))
                            .average().orElse(0.0);
                    sumPerVocabAvg += avgForThisVocab;
                    vocabCount++;
                }
                if (vocabCount > 0)
                    avgWordScore = Math.round((sumPerVocabAvg / vocabCount) * 100.0) / 100.0;
            }

            if (!byLine.isEmpty()) {
                double sumPerLineAvg = 0.0;
                int lineCount = 0;
                for (Map.Entry<Long, List<com.bucha.entity.IseLessonEntry>> le : byLine.entrySet()) {
                    List<com.bucha.entity.IseLessonEntry> items = le.getValue();
                    double avgForThisLine = items.stream().mapToDouble(
                            it -> Optional.ofNullable(it.getTotalScore()).orElse(0.0))
                            .average().orElse(0.0);
                    sumPerLineAvg += avgForThisLine;
                    lineCount++;
                }
                if (lineCount > 0)
                    avgSentenceScore = Math.round((sumPerLineAvg / lineCount) * 100.0) / 100.0;
            }

            if (avgWordScore != null)
                out.put("avgWordScore", avgWordScore);
            if (avgSentenceScore != null)
                out.put("avgSentenceScore", avgSentenceScore);
        } catch (Exception e) {
            logger.debug("failed to compute per-item averages for pronouncedForLesson", e);
        }

        return out;
    }

    /**
     * Get distinct vocabulary IDs for a user
     */
    public Map<String, Object> getDistinctVocabForUser(Long userId) {
        try {
            List<Long> ids = iseRepository.findDistinctVocabularyIdsByUser(userId);
            List<String> strIds = (ids == null) ? Collections.emptyList()
                    : ids.stream().map(String::valueOf).collect(Collectors.toList());
            return Map.of("vocabularyIds", strIds, "count", strIds.size());
        } catch (Exception e) {
            logger.debug("failed to get distinct vocab ids for user {}", userId, e);
            throw new RuntimeException("failed to fetch distinct vocabulary ids");
        }
    }

    /**
     * Get daily leaderboard
     */
    public Map<String, Object> getDailyLeaderboard(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        LocalDateTime start = target.atStartOfDay();
        LocalDateTime end = target.atTime(LocalTime.MAX);

        List<com.bucha.entity.IseDailyEntry> entries = iseDailyEntryRepository.findBySessionDateBetween(start, end);

        Map<Long, List<com.bucha.entity.IseDailyEntry>> byUser = entries.stream()
                .filter(e -> e.getUser() != null && e.getUser().getId() != null)
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map.Entry<Long, List<com.bucha.entity.IseDailyEntry>> ent : byUser.entrySet()) {
            Long userId = ent.getKey();
            List<com.bucha.entity.IseDailyEntry> list = ent.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            long completionCount = list.size();

            LocalDate y = target.minusDays(1);
            LocalDateTime ys = y.atStartOfDay();
            LocalDateTime ye = y.atTime(LocalTime.MAX);
            List<com.bucha.entity.IseDailyEntry> yEntries = iseDailyEntryRepository
                    .findByUser_IdAndSessionDateBetween(userId, ys, ye);
            double yAvg = yEntries.stream()
                    .mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average().orElse(0.0);
            double improvement = Math.round((avg - yAvg) * 100.0) / 100.0;

            UserEntity user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("user not found"));

            Map<String, Object> row = new HashMap<>();
            row.put("userId", userId);
            row.put("name", user.getName());
            row.put("avatar", null);
            row.put("avgScore", Math.round(avg * 100.0) / 100.0);
            row.put("completionCount", completionCount);
            row.put("improvementRate", improvement);
            row.put("timestamp", list.stream().map(e -> e.getCreatedAt()).min(LocalDateTime::compareTo).orElse(null));
            rows.add(row);
        }

        return Map.of("rows", rows);
    }

    /**
     * Get weekly stats for a user
     */
    public Map<String, Object> getWeeklyStats(Long userId, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusWeeks(3);

        LocalDate iterStart = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate iterEnd = endDate;

        LocalDateTime start = iterStart.atStartOfDay();
        LocalDateTime end = iterEnd.atTime(LocalTime.MAX);

        try {
            List<Object[]> queryResults = iseDailyEntryRepository.getDailyStatsGrouped(userId, start, end);

            Map<LocalDate, Map<String, Object>> dayMap = new HashMap<>();
            for (Object[] row : queryResults) {
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate ld = sqlDate.toLocalDate();
                Map<String, Object> v = new HashMap<>();
                Number avgNum = (Number) row[1];
                double avgVal = (avgNum == null) ? 0.0 : avgNum.doubleValue();
                Number cntAttemptsNum = (Number) row[2];
                Number cntRowsNum = (Number) row[3];
                int cntVal = 0;
                if (cntAttemptsNum != null)
                    cntVal = cntAttemptsNum.intValue();
                else if (cntRowsNum != null)
                    cntVal = cntRowsNum.intValue();
                Number durNum = (Number) row[4];
                long durVal = (durNum == null) ? 0L : durNum.longValue();
                v.put("avg", avgVal);
                v.put("count", cntVal);
                v.put("duration", durVal);
                dayMap.put(ld, v);
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            LocalDate d = iterStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            while (!d.isAfter(iterEnd)) {
                LocalDate weekStart = d;
                LocalDate weekEnd = d.plusDays(6);
                double sumWeighted = 0.0;
                int sumCount = 0;
                long sumDuration = 0L;
                for (LocalDate day = weekStart; !day.isAfter(weekEnd); day = day.plusDays(1)) {
                    Map<String, Object> v = dayMap.get(day);
                    if (v != null) {
                        double dayAvg = (double) v.get("avg");
                        int c = (int) v.get("count");
                        long dur = (long) v.get("duration");
                        sumWeighted += dayAvg * c;
                        sumCount += c;
                        sumDuration += dur;
                    }
                }
                double weekAvg = sumCount > 0 ? (sumWeighted / sumCount) : 0.0;
                Map<String, Object> row = new HashMap<>();
                row.put("weekStart", weekStart.toString());
                row.put("avgScore", Math.round(weekAvg * 100.0) / 100.0);
                row.put("count", sumCount);
                row.put("durationSeconds", sumDuration);
                rows.add(row);
                d = d.plusWeeks(1);
            }

            return Map.of("rows", rows);
        } catch (Exception e) {
            logger.debug("failed to compute weekly stats by SQL", e);
            throw new RuntimeException("failed to compute weekly stats");
        }
    }

    /**
     * Get weekly leaderboard - uses ise_lesson_entry table
     * Gets data for the specific week containing the given date (Monday to Sunday)
     */
    public Map<String, Object> getWeeklyLeaderboard(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        // Calculate the week start (Monday) and end (Sunday) for the target date
        LocalDate weekStart = target.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);
        LocalDateTime start = weekStart.atStartOfDay();
        LocalDateTime end = weekEnd.atTime(LocalTime.MAX);

        try {
            List<Object[]> cur = iseLessonEntryRepository.getWeeklyLeaderboardStats(start, end);

            // If still no data, try getting all time data
            if (cur.isEmpty()) {
                cur = iseLessonEntryRepository.getAllTimeLeaderboardStats();
            }

            // Calculate previous week for improvement comparison
            LocalDate prevWeekStart = weekStart.minusWeeks(1);
            LocalDate prevWeekEnd = prevWeekStart.plusDays(6);
            LocalDateTime pys = prevWeekStart.atStartOfDay();
            LocalDateTime pye = prevWeekEnd.atTime(LocalTime.MAX);
            List<Object[]> prev = iseLessonEntryRepository.getWeeklyLeaderboardStats(pys, pye);

            Map<Long, Double> prevAvgByUser = new HashMap<>();
            for (Object[] p : prev) {
                Long uid = ((Number) p[0]).longValue();
                Double avg = ((Number) p[1]).doubleValue();
                if (uid != null && avg != null)
                    prevAvgByUser.put(uid, avg);
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            for (Object[] r : cur) {
                Long userId = ((Number) r[0]).longValue();
                double avg = ((Number) r[1]).doubleValue();
                long completionCount = ((Number) r[2]).longValue();
                Object tsObj = r[3];

                double prevAvg = prevAvgByUser.getOrDefault(userId, 0.0);
                double improvement = Math.round((avg - prevAvg) * 100.0) / 100.0;

                UserEntity user = userService.findById(userId)
                        .orElseThrow(() -> new RuntimeException("user not found"));

                Map<String, Object> row = new HashMap<>();
                row.put("userId", userId);
                row.put("name", user.getName());
                row.put("avatar", null);
                row.put("avgScore", Math.round(avg * 100.0) / 100.0);
                row.put("completionCount", completionCount);
                row.put("improvementRate", improvement);
                row.put("timestamp", tsObj);
                rows.add(row);
            }

            return Map.of("rows", rows);
        } catch (Exception e) {
            logger.debug("failed to compute weekly leaderboard by SQL", e);
            throw new RuntimeException("failed to compute weekly leaderboard");
        }
    }

    /**
     * Get lesson leaderboard
     */
    public Map<String, Object> getLessonLeaderboard(Long lessonId, LocalDate date) {
        if (lessonId == null) {
            throw new IllegalArgumentException("lessonId is required");
        }

        List<com.bucha.entity.IseDailyEntry> entries;
        if (date == null) {
            entries = iseDailyEntryRepository.findByLessonId(lessonId);
        } else {
            LocalDate target = date;
            LocalDateTime start = target.atStartOfDay();
            LocalDateTime end = target.atTime(LocalTime.MAX);
            entries = iseDailyEntryRepository.findByLessonIdAndSessionDateBetween(lessonId, start, end);
        }

        Map<Long, List<com.bucha.entity.IseDailyEntry>> byUser = entries.stream()
                .filter(e -> e.getUser() != null && e.getUser().getId() != null)
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map.Entry<Long, List<com.bucha.entity.IseDailyEntry>> ent : byUser.entrySet()) {
            Long userId = ent.getKey();
            List<com.bucha.entity.IseDailyEntry> list = ent.getValue();
            if (list == null || list.isEmpty())
                continue;

            double best = list.stream()
                    .mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .max().orElse(0.0);
            double avg = list.stream()
                    .mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            int attempts = list.size();

            UserEntity user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("user not found"));
            Map<String, Object> row = new HashMap<>();
            row.put("userId", userId);
            row.put("name", user.getName());
            row.put("score", Math.round(best * 100.0) / 100.0);
            row.put("bestScore", Math.round(best * 100.0) / 100.0);
            row.put("avgScore", Math.round(avg * 100.0) / 100.0);
            row.put("attempts", attempts);
            rows.add(row);
        }

        rows.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));

        return Map.of("rows", rows);
    }
}
