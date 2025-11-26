package com.bucha.service;

import com.bucha.dto.response.*;
import com.bucha.entity.User;
import com.bucha.entity.UserLesson;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IseStatsService {
    private final IseRepository iseRepository;
    private final IseDailyEntryRepository iseDailyEntryRepository;
    private final IseLessonEntryRepository iseLessonEntryRepository;
    private final IseTestEntryRepository iseTestEntryRepository;
    private final UserLessonRepository userLessonRepository;
    private final UserService userService;
    private final JdbcTemplate jdbcTemplate;
    private static final Logger logger = LoggerFactory.getLogger(IseStatsService.class);

    // Daily stats (without debug)
    @Transactional(readOnly = true)
    public List<PeriodStatRowResponse> getDailyStats(Long userId, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusDays(29);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        try {
            String sql = "SELECT DATE(session_date) AS day, AVG(total_score) AS avg_score, "
                    + "COUNT(DISTINCT attempt_id) AS cnt_attempts, COUNT(*) AS cnt_rows, SUM(duration_seconds) AS duration_sum "
                    + "FROM ise_daily_entry ide "
                    + "WHERE ide.user_id = ? AND ide.session_date BETWEEN ? AND ? "
                    + "GROUP BY DATE(session_date)";
            List<Map<String, Object>> sqlRows = jdbcTemplate.queryForList(sql, userId, start, end);
            Map<LocalDate, Map<String, Object>> lookup = new HashMap<>();
            for (Map<String, Object> r : sqlRows) {
                Object dateObj = r.get("day");
                if (dateObj == null)
                    dateObj = r.get("date");
                if (dateObj != null) {
                    LocalDate ld = LocalDate.parse(dateObj.toString());
                    lookup.put(ld, r);
                }
            }
            List<PeriodStatRowResponse> rows = new ArrayList<>();
            LocalDate d = startDate;
            while (!d.isAfter(endDate)) {
                Map<String, Object> r = lookup.get(d);
                if (r == null) {
                    rows.add(PeriodStatRowResponse.builder()
                            .periodStart(d.toString())
                            .avgScore(0.0)
                            .count(0)
                            .durationSeconds(0L)
                            .build());
                } else {
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
                    rows.add(PeriodStatRowResponse.builder()
                            .periodStart(d.toString())
                            .avgScore(Math.round(avgVal * 100.0) / 100.0)
                            .count(cntVal)
                            .durationSeconds(durVal)
                            .build());
                }
                d = d.plusDays(1);
            }
            return rows;
        } catch (Exception e) {
            logger.debug("failed to compute daily stats", e);
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDailyStatsDebug(Long userId, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusDays(29);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        try {
            String sql = "SELECT DATE(session_date) AS day, AVG(total_score) AS avg_score, "
                    + "COUNT(DISTINCT attempt_id) AS cnt_attempts, COUNT(*) AS cnt_rows, SUM(duration_seconds) AS duration_sum "
                    + "FROM ise_daily_entry ide "
                    + "WHERE ide.user_id = ? AND ide.session_date BETWEEN ? AND ? "
                    + "GROUP BY DATE(session_date)";
            List<Map<String, Object>> sqlRows = jdbcTemplate.queryForList(sql, userId, start, end);
            List<PeriodStatRowResponse> rows = getDailyStats(userId, from, to);
            return Map.of("rows", rows, "sqlRows", sqlRows);
        } catch (Exception e) {
            logger.debug("failed to compute daily stats debug", e);
            return Map.of("rows", Collections.emptyList(), "sqlRows", Collections.emptyList());
        }
    }

    @Transactional(readOnly = true)
    public List<LeaderboardRowResponse> getLessonStats(Long userId) {
        List<com.bucha.entity.IseLessonEntry> lessonEntries = iseLessonEntryRepository.findByUser_Id(userId);
        Map<Long, List<com.bucha.entity.IseLessonEntry>> grouped = lessonEntries.stream()
                .filter(e -> e.getLessonId() != null)
                .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getLessonId));
        List<LeaderboardRowResponse> dtoRows = grouped.entrySet().stream().map(e -> {
            Long lessonId = e.getKey();
            List<com.bucha.entity.IseLessonEntry> list = e.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average()
                    .orElse(0.0);
            UserLesson userLesson = userLessonRepository.findByUser_IdAndLesson_Id(userId, lessonId).orElse(null);
            boolean completed = userLesson != null && Boolean.TRUE.equals(userLesson.getCompleted());
            double award = completed ? (0.1 * avg) : 0.0;
            double lessonScore = avg + award;
            return LeaderboardRowResponse.builder()
                    .userId(lessonId)
                    .bestScore(Math.round(lessonScore * 100.0) / 100.0)
                    .avgScore(Math.round(avg * 100.0) / 100.0)
                    .attempts(completed ? 1 : 0)
                    .name(null)
                    .build();
        }).collect(Collectors.toList());
        return dtoRows;
    }

    @Transactional(readOnly = true)
    public List<TestStatsRowResponse> getTestStats(Long userId) {
        List<com.bucha.entity.IseTestEntry> testEntries = iseTestEntryRepository.findByUser_Id(userId);
        Map<Long, List<com.bucha.entity.IseTestEntry>> grouped = testEntries.stream()
                .filter(e -> e.getTestId() != null)
                .collect(Collectors.groupingBy(com.bucha.entity.IseTestEntry::getTestId));
        return grouped.entrySet().stream().map(e -> {
            Long testId = e.getKey();
            List<com.bucha.entity.IseTestEntry> list = e.getValue();
            double avgTotal = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            List<TestAttemptEntryResponse> entriesDto = list.stream().map(s -> TestAttemptEntryResponse.builder()
                    .id(s.getId())
                    .totalScore(s.getTotalScore())
                    .sessionDate(s.getSessionDate())
                    .build()).collect(Collectors.toList());
            return TestStatsRowResponse.builder()
                    .testId(testId)
                    .avgTotal(Math.round(avgTotal * 100.0) / 100.0)
                    .attempts(list.size())
                    .entries(entriesDto)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PronouncedLessonStatsResponse getPronouncedForLesson(Long userId, Long lessonId) {
        List<Long> lineIds = iseDailyEntryRepository.findDistinctLineIdsByUserAndLesson(userId, lessonId);
        List<Long> vocabIds = iseDailyEntryRepository.findDistinctVocabularyIdsByUserAndLesson(userId, lessonId);
        int distinctLineCount = lineIds == null ? 0 : lineIds.size();
        int distinctVocabCount = vocabIds == null ? 0 : vocabIds.size();
        int pronouncedCount = distinctLineCount + distinctVocabCount;
        List<String> lineIdStrs = lineIds == null ? Collections.emptyList()
                : lineIds.stream().map(String::valueOf).collect(Collectors.toList());
        List<String> vocabIdStrs = vocabIds == null ? Collections.emptyList()
                : vocabIds.stream().map(String::valueOf).collect(Collectors.toList());
        Double avgWordScore = null;
        Double avgSentenceScore = null;
        try {
            List<com.bucha.entity.IseLessonEntry> lessonEntriesAll = iseLessonEntryRepository
                    .findByUser_IdAndLessonId(userId, lessonId);
            Map<Long, List<com.bucha.entity.IseLessonEntry>> byVocab = lessonEntriesAll.stream()
                    .filter(e -> e.getVocabularyId() != null)
                    .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getVocabularyId));
            Map<Long, List<com.bucha.entity.IseLessonEntry>> byLine = lessonEntriesAll.stream()
                    .filter(e -> e.getLineId() != null)
                    .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getLineId));
            if (!byVocab.isEmpty()) {
                double sumPerVocabAvg = 0.0;
                int vocabCount = 0;
                for (Map.Entry<Long, List<com.bucha.entity.IseLessonEntry>> ve : byVocab.entrySet()) {
                    double avgForThisVocab = ve.getValue().stream()
                            .mapToDouble(it -> Optional.ofNullable(it.getTotalScore()).orElse(0.0)).average()
                            .orElse(0.0);
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
                    double avgForThisLine = le.getValue().stream()
                            .mapToDouble(it -> Optional.ofNullable(it.getTotalScore()).orElse(0.0)).average()
                            .orElse(0.0);
                    sumPerLineAvg += avgForThisLine;
                    lineCount++;
                }
                if (lineCount > 0)
                    avgSentenceScore = Math.round((sumPerLineAvg / lineCount) * 100.0) / 100.0;
            }
        } catch (Exception e) {
            logger.debug("failed pronounced avg", e);
        }
        return PronouncedLessonStatsResponse.builder()
                .lineIds(lineIdStrs)
                .vocabularyIds(vocabIdStrs)
                .distinctLineCount(distinctLineCount)
                .distinctVocabularyCount(distinctVocabCount)
                .pronouncedCount(pronouncedCount)
                .avgWordScore(avgWordScore)
                .avgSentenceScore(avgSentenceScore)
                .build();
    }

    @Transactional(readOnly = true)
    public DistinctVocabularyResponse getDistinctVocabForUser(Long userId) {
        try {
            List<Long> ids = iseRepository.findDistinctVocabularyIdsByUser(userId);
            List<String> strIds = (ids == null) ? Collections.emptyList()
                    : ids.stream().map(String::valueOf).collect(Collectors.toList());
            return DistinctVocabularyResponse.builder().vocabularyIds(strIds).count(strIds.size()).build();
        } catch (Exception e) {
            logger.debug("failed distinct vocab", e);
            return DistinctVocabularyResponse.builder().vocabularyIds(Collections.emptyList()).count(0).build();
        }
    }

    @Transactional(readOnly = true)
    public List<LeaderboardRowResponse> getDailyLeaderboard(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        LocalDateTime start = target.atStartOfDay();
        LocalDateTime end = target.atTime(LocalTime.MAX);
        List<com.bucha.entity.IseDailyEntry> entries = iseDailyEntryRepository.findBySessionDateBetween(start, end);
        Map<Long, List<com.bucha.entity.IseDailyEntry>> byUser = entries.stream()
                .filter(e -> e.getUser() != null && e.getUser().getId() != null)
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));
        List<LeaderboardRowResponse> dtoRows = new ArrayList<>();
        for (Map.Entry<Long, List<com.bucha.entity.IseDailyEntry>> ent : byUser.entrySet()) {
            Long userId = ent.getKey();
            List<com.bucha.entity.IseDailyEntry> list = ent.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average()
                    .orElse(0.0);
            long completionCount = list.size();
            LocalDate y = target.minusDays(1);
            LocalDateTime ys = y.atStartOfDay();
            LocalDateTime ye = y.atTime(LocalTime.MAX);
            List<com.bucha.entity.IseDailyEntry> yEntries = iseDailyEntryRepository
                    .findByUser_IdAndSessionDateBetween(userId, ys, ye);
            double yAvg = yEntries.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            double improvement = Math.round((avg - yAvg) * 100.0) / 100.0;
            User user = userService.findById(userId).orElse(null);
            dtoRows.add(LeaderboardRowResponse.builder()
                    .userId(userId)
                    .name(user != null ? user.getName() : null)
                    .avatar(null)
                    .avgScore(Math.round(avg * 100.0) / 100.0)
                    .completionCount(completionCount)
                    .improvementRate(improvement)
                    .timestamp(list.stream().map(e -> e.getCreatedAt()).min(LocalDateTime::compareTo).orElse(null))
                    .build());
        }
        return dtoRows;
    }

    @Transactional(readOnly = true)
    public List<PeriodStatRowResponse> getWeeklyStats(Long userId, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusWeeks(3);
        LocalDate iterStart = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate iterEnd = endDate;
        LocalDateTime start = iterStart.atStartOfDay();
        LocalDateTime end = iterEnd.atTime(LocalTime.MAX);
        try {
            String sql = "SELECT DATE(session_date) AS day, AVG(total_score) AS avg_score, "
                    + "COUNT(DISTINCT attempt_id) AS cnt_attempts, COUNT(*) AS cnt_rows, SUM(duration_seconds) AS duration_sum "
                    + "FROM ise_daily_entry ide "
                    + "WHERE ide.user_id = ? AND ide.session_date BETWEEN ? AND ? "
                    + "GROUP BY DATE(session_date)";
            List<Map<String, Object>> sqlRows = jdbcTemplate.queryForList(sql, userId, start, end);
            Map<LocalDate, Map<String, Object>> dayMap = new HashMap<>();
            for (Map<String, Object> r : sqlRows) {
                Object dateObj = r.get("day");
                if (dateObj == null)
                    dateObj = r.get("date");
                if (dateObj == null)
                    continue;
                LocalDate ld = LocalDate.parse(dateObj.toString());
                Map<String, Object> v = new HashMap<>();
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
                v.put("avg", avgVal);
                v.put("count", cntVal);
                v.put("duration", durVal);
                dayMap.put(ld, v);
            }
            List<PeriodStatRowResponse> dtoRows = new ArrayList<>();
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
                dtoRows.add(PeriodStatRowResponse.builder()
                        .periodStart(weekStart.toString())
                        .avgScore(Math.round(weekAvg * 100.0) / 100.0)
                        .count(sumCount)
                        .durationSeconds(sumDuration)
                        .build());
                d = d.plusWeeks(1);
            }
            return dtoRows;
        } catch (Exception e) {
            logger.debug("failed weekly stats", e);
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public WeeklyLeaderboardResponse getWeeklyLeaderboard(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        LocalDate weekStart = target.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime start = weekStart.atStartOfDay();
        LocalDateTime end = weekStart.plusDays(6).atTime(LocalTime.MAX);
        try {
            String sql = "SELECT ide.user_id as user_id, AVG(ide.total_score) as avg_score, COUNT(*) as cnt, MIN(ide.created_at) as ts "
                    + "FROM ise_daily_entry ide "
                    + "WHERE ide.session_date BETWEEN ? AND ? "
                    + "GROUP BY ide.user_id";
            List<Map<String, Object>> cur = jdbcTemplate.queryForList(sql, start, end);
            LocalDate prevWeekStart = weekStart.minusWeeks(1);
            LocalDateTime pys = prevWeekStart.atStartOfDay();
            LocalDateTime pye = prevWeekStart.plusDays(6).atTime(LocalTime.MAX);
            List<Map<String, Object>> prev = jdbcTemplate.queryForList(sql, pys, pye);
            Map<Long, Double> prevAvgByUser = new HashMap<>();
            for (Map<String, Object> p : prev) {
                Number uid = (Number) p.get("user_id");
                Number avg = (Number) p.get("avg_score");
                if (uid != null && avg != null)
                    prevAvgByUser.put(uid.longValue(), avg.doubleValue());
            }
            List<LeaderboardRowResponse> rows = new ArrayList<>();
            for (Map<String, Object> r : cur) {
                Number uid = (Number) r.get("user_id");
                if (uid == null)
                    continue;
                Long uId = uid.longValue();
                double avg = ((Number) r.get("avg_score")).doubleValue();
                long completionCount = ((Number) r.get("cnt")).longValue();
                Object tsObj = r.get("ts");
                double prevAvg = prevAvgByUser.getOrDefault(uId, 0.0);
                double improvement = Math.round((avg - prevAvg) * 100.0) / 100.0;
                User user = userService.findById(uId).orElse(null);
                LocalDateTime ts = null;
                if (tsObj instanceof LocalDateTime) {
                    ts = (LocalDateTime) tsObj;
                } else if (tsObj != null) {
                    try {
                        ts = LocalDateTime.parse(tsObj.toString());
                    } catch (Exception ignore) {
                        ts = null;
                    }
                }
                rows.add(LeaderboardRowResponse.builder()
                        .userId(uId)
                        .name(user != null ? user.getName() : null)
                        .avatar(null)
                        .avgScore(Math.round(avg * 100.0) / 100.0)
                        .completionCount(completionCount)
                        .improvementRate(improvement)
                        .timestamp(ts)
                        .build());
            }
            return WeeklyLeaderboardResponse.builder().rows(rows).build();
        } catch (Exception e) {
            logger.debug("failed weekly leaderboard", e);
            return WeeklyLeaderboardResponse.builder().rows(Collections.emptyList()).build();
        }
    }

    @Transactional(readOnly = true)
    public List<LeaderboardRowResponse> getLessonLeaderboard(Long lessonId, LocalDate date) {
        if (lessonId == null)
            return Collections.emptyList();
        List<com.bucha.entity.IseDailyEntry> entries;
        if (date == null) {
            entries = iseDailyEntryRepository.findByLessonId(lessonId);
        } else {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
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
            double best = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).max()
                    .orElse(0.0);
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average()
                    .orElse(0.0);
            int attempts = list.size();
            User user = userService.findById(userId).orElse(null);
            Map<String, Object> row = new HashMap<>();
            row.put("userId", userId);
            row.put("name", user != null ? user.getName() : null);
            row.put("score", Math.round(best * 100.0) / 100.0);
            row.put("bestScore", Math.round(best * 100.0) / 100.0);
            row.put("avgScore", Math.round(avg * 100.0) / 100.0);
            row.put("attempts", attempts);
            rows.add(row);
        }
        rows.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));
        return rows.stream().map(r -> LeaderboardRowResponse.builder()
                .userId((Long) r.get("userId"))
                .name((String) r.get("name"))
                .bestScore(((Number) r.get("bestScore")).doubleValue())
                .avgScore(((Number) r.get("avgScore")).doubleValue())
                .attempts(((Number) r.get("attempts")).intValue())
                .build()).collect(Collectors.toList());
    }
}
