package com.bucha.service;

import com.bucha.dto.ise.*;
import com.bucha.entity.IseDailyEntry;
import com.bucha.entity.IseLessonEntry;
import com.bucha.entity.IseTestEntry;
import com.bucha.entity.UserEntity;
import com.bucha.entity.UserLesson;
import com.bucha.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
@Slf4j
public class IseStatsService {

    private final IseRepository iseRepository;
    private final IseDailyEntryRepository iseDailyEntryRepository;
    private final IseLessonEntryRepository iseLessonEntryRepository;
    private final IseTestEntryRepository iseTestEntryRepository;
    private final UserLessonRepository userLessonRepository;
    private final UserService userService;
    private final LeaderboardService leaderboardService;

    public Map<String, Object> getDailyStats(Long userId, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusDays(29);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> sqlRows = iseDailyEntryRepository.aggregateDailyStatsByUserAndDateRange(userId, start, end);
        Map<LocalDate, Object[]> lookup = new HashMap<>();
        for (Object[] r : sqlRows) {
            if (r == null || r.length < 5) continue;
            LocalDate ld = toLocalDate(r[0]);
            if (ld != null) lookup.put(ld, r);
        }

        List<DailyStatsRowDto> rows = new ArrayList<>();
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            Object[] r = lookup.get(d);
            if (r == null) {
                rows.add(DailyStatsRowDto.builder().date(d.toString()).avgScore(0.0).count(0).durationSeconds(0L).build());
            } else {
                double avgVal = toDouble(r[1], 0.0);
                int cntVal = toInt(r[2], r[3], 0);
                long durVal = toLong(r[4], 0L);
                rows.add(DailyStatsRowDto.builder()
                        .date(d.toString())
                        .avgScore(round2(avgVal))
                        .count(cntVal)
                        .durationSeconds(durVal)
                        .build());
            }
        }
        return Map.of("rows", rows);
    }

    public Map<String, Object> getLessonStats(Long userId) {
        List<IseLessonEntry> lessonEntries = iseLessonEntryRepository.findByUser_Id(userId);
        Map<Long, List<IseLessonEntry>> grouped = lessonEntries.stream()
                .filter(e -> e.getLessonId() != null)
                .collect(Collectors.groupingBy(IseLessonEntry::getLessonId));

        List<LessonStatsRowDto> rows = grouped.entrySet().stream().map(e -> {
            Long lessonId = e.getKey();
            List<IseLessonEntry> list = e.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average().orElse(0.0);
            UserLesson userLesson = userLessonRepository.findByUser_IdAndLesson_Id(userId, lessonId).orElse(null);
            boolean completed = userLesson != null && userLesson.isCompleted();
            double award = completed ? (0.1 * avg) : 0.0;
            double lessonScore = avg + award;
            return LessonStatsRowDto.builder()
                    .lessonId(lessonId)
                    .avgScore(round2(avg))
                    .completedFull(completed)
                    .award(round2(award))
                    .lessonScore(round2(lessonScore))
                    .build();
        }).collect(Collectors.toList());
        return Map.of("rows", rows);
    }

    public Map<String, Object> getTestStats(Long userId) {
        List<IseTestEntry> testEntries = iseTestEntryRepository.findByUser_Id(userId);
        Map<Long, List<IseTestEntry>> grouped = testEntries.stream()
                .filter(e -> e.getTestId() != null)
                .collect(Collectors.groupingBy(IseTestEntry::getTestId));

        List<TestStatsRowDto> rows = grouped.entrySet().stream().map(e -> {
            Long testId = e.getKey();
            List<IseTestEntry> list = e.getValue();
            double avgTotal = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average().orElse(0.0);
            List<TestStatsEntryDto> entries = list.stream()
                    .map(s -> TestStatsEntryDto.builder()
                            .id(s.getId())
                            .totalScore(s.getTotalScore())
                            .sessionDate(s.getSessionDate() == null ? null : s.getSessionDate().toString())
                            .build())
                    .collect(Collectors.toList());
            return TestStatsRowDto.builder()
                    .testId(testId)
                    .avgTotal(round2(avgTotal))
                    .attempts(list.size())
                    .entries(entries)
                    .build();
        }).collect(Collectors.toList());
        return Map.of("rows", rows);
    }

    /** lessonIdsParam: comma-separated lesson IDs. Parsing done in service. */
    public Map<String, PronouncedForLessonDto> getPronouncedBatch(Long userId, String lessonIdsParam) {
        List<Long> lessonIds = parseLessonIds(lessonIdsParam);
        Map<String, PronouncedForLessonDto> result = new HashMap<>();
        for (Long lessonId : lessonIds) {
            try {
                result.put(String.valueOf(lessonId), computePronouncedForLesson(userId, lessonId));
            } catch (Exception e) {
                log.debug("pronounced batch for lesson {} failed: {}", lessonId, e.getMessage());
                result.put(String.valueOf(lessonId), PronouncedForLessonDto.builder().build());
            }
        }
        return result;
    }

    public PronouncedForLessonDto computePronouncedForLesson(Long userId, Long lessonId) {
        List<Long> lineIds = iseDailyEntryRepository.findDistinctLineIdsByUserAndLesson(userId, lessonId);
        List<Long> vocabIds = iseDailyEntryRepository.findDistinctVocabularyIdsByUserAndLesson(userId, lessonId);
        int distinctLineCount = (lineIds == null) ? 0 : lineIds.size();
        int distinctVocabCount = (vocabIds == null) ? 0 : vocabIds.size();
        int pronouncedCount = distinctLineCount + distinctVocabCount;
        List<String> lineIdStrs = (lineIds == null) ? Collections.emptyList() : lineIds.stream().map(String::valueOf).collect(Collectors.toList());
        List<String> vocabIdStrs = (vocabIds == null) ? Collections.emptyList() : vocabIds.stream().map(String::valueOf).collect(Collectors.toList());

        PronouncedForLessonDto.PronouncedForLessonDtoBuilder builder = PronouncedForLessonDto.builder()
                .lineIds(lineIdStrs)
                .vocabularyIds(vocabIdStrs)
                .distinctLineCount(distinctLineCount)
                .distinctVocabularyCount(distinctVocabCount)
                .pronouncedCount(pronouncedCount);

        List<IseLessonEntry> lessonEntriesAll = iseLessonEntryRepository.findByUser_IdAndLessonId(userId, lessonId);
        Map<Long, List<IseLessonEntry>> byVocab = lessonEntriesAll.stream().filter(e -> e.getVocabularyId() != null).collect(Collectors.groupingBy(IseLessonEntry::getVocabularyId));
        Map<Long, List<IseLessonEntry>> byLine = lessonEntriesAll.stream().filter(e -> e.getLineId() != null).collect(Collectors.groupingBy(IseLessonEntry::getLineId));
        if (!byVocab.isEmpty()) {
            double sum = byVocab.values().stream().mapToDouble(ve -> ve.stream().mapToDouble(it -> Optional.ofNullable(it.getTotalScore()).orElse(0.0)).average().orElse(0.0)).sum();
            int n = byVocab.size();
            if (n > 0) builder.avgWordScore(round2(sum / n));
        }
        if (!byLine.isEmpty()) {
            double sum = byLine.values().stream().mapToDouble(le -> le.stream().mapToDouble(it -> Optional.ofNullable(it.getTotalScore()).orElse(0.0)).average().orElse(0.0)).sum();
            int n = byLine.size();
            if (n > 0) builder.avgSentenceScore(round2(sum / n));
        }
        return builder.build();
    }

    public DistinctVocabResponseDto getDistinctVocabForUser(Long userId) {
        List<Long> ids = iseRepository.findDistinctVocabularyIdsByUser(userId);
        List<String> strIds = (ids == null) ? Collections.emptyList() : ids.stream().map(String::valueOf).collect(Collectors.toList());
        return DistinctVocabResponseDto.builder().vocabularyIds(strIds).count(strIds.size()).build();
    }

    public Map<String, Object> getDailyLeaderboard(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        LocalDateTime start = target.atStartOfDay();
        LocalDateTime end = target.atTime(LocalTime.MAX);

        List<IseDailyEntry> entries = iseDailyEntryRepository.findBySessionDateBetween(start, end);
        Map<Long, List<IseDailyEntry>> byUser = entries.stream()
                .filter(e -> e.getUser() != null && e.getUser().getId() != null)
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        List<LeaderboardRowDto> rows = new ArrayList<>();
        for (Map.Entry<Long, List<IseDailyEntry>> ent : byUser.entrySet()) {
            Long uid = ent.getKey();
            List<IseDailyEntry> list = ent.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average().orElse(0.0);
            long completionCount = list.size();
            LocalDate y = target.minusDays(1);
            List<IseDailyEntry> yEntries = iseDailyEntryRepository.findByUser_IdAndSessionDateBetween(uid, y.atStartOfDay(), y.atTime(LocalTime.MAX));
            double yAvg = yEntries.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average().orElse(0.0);
            UserEntity user = userService.findById(uid).orElseThrow(() -> new RuntimeException("user not found"));
            LocalDateTime timestamp = list.stream().map(IseDailyEntry::getCreatedAt).filter(Objects::nonNull).min(LocalDateTime::compareTo).orElse(null);
            rows.add(LeaderboardRowDto.builder()
                    .userId(uid)
                    .name(user.getName())
                    .avatar(null)
                    .avgScore(round2(avg))
                    .completionCount(completionCount)
                    .improvementRate(round2(avg - yAvg))
                    .timestamp(timestamp)
                    .build());
        }
        return Map.of("rows", rows);
    }

    public Map<String, Object> getWeeklyStats(Long userId, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate = (from != null) ? from : endDate.minusWeeks(3);
        LocalDate iterStart = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate iterEnd = endDate;
        LocalDateTime start = iterStart.atStartOfDay();
        LocalDateTime end = iterEnd.atTime(LocalTime.MAX);

        List<Object[]> sqlRows = iseDailyEntryRepository.aggregateDailyStatsByUserAndDateRange(userId, start, end);
        Map<LocalDate, Object[]> dayMap = new HashMap<>();
        for (Object[] r : sqlRows) {
            if (r == null || r.length < 5) continue;
            LocalDate ld = toLocalDate(r[0]);
            if (ld != null) dayMap.put(ld, r);
        }

        List<WeeklyStatsRowDto> rows = new ArrayList<>();
        for (LocalDate d = iterStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)); !d.isAfter(iterEnd); d = d.plusWeeks(1)) {
            LocalDate weekStart = d;
            LocalDate weekEnd = d.plusDays(6);
            double sumWeighted = 0.0;
            int sumCount = 0;
            long sumDuration = 0L;
            for (LocalDate day = weekStart; !day.isAfter(weekEnd); day = day.plusDays(1)) {
                Object[] v = dayMap.get(day);
                if (v != null) {
                    double dayAvg = toDouble(v[1], 0.0);
                    int c = toInt(v[2], v[3], 0);
                    long dur = toLong(v[4], 0L);
                    sumWeighted += dayAvg * c;
                    sumCount += c;
                    sumDuration += dur;
                }
            }
            double weekAvg = sumCount > 0 ? (sumWeighted / sumCount) : 0.0;
            rows.add(WeeklyStatsRowDto.builder()
                    .weekStart(weekStart.toString())
                    .avgScore(round2(weekAvg))
                    .count(sumCount)
                    .durationSeconds(sumDuration)
                    .build());
        }
        return Map.of("rows", rows);
    }

    public Map<String, Object> getWeeklyLeaderboard(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        LocalDate weekStart = target.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime start = weekStart.atStartOfDay();
        LocalDateTime end = weekStart.plusDays(6).atTime(LocalTime.MAX);
        LocalDate prevWeekStart = weekStart.minusWeeks(1);
        LocalDateTime pys = prevWeekStart.atStartOfDay();
        LocalDateTime pye = prevWeekStart.plusDays(6).atTime(LocalTime.MAX);

        List<Object[]> cur = iseDailyEntryRepository.aggregateUserStatsByDateRange(start, end);
        List<Object[]> prev = iseDailyEntryRepository.aggregateUserStatsByDateRange(pys, pye);
        Map<Long, Double> prevAvgByUser = new HashMap<>();
        for (Object[] p : prev) {
            if (p == null || p.length < 2) continue;
            Long uid = toLong(p[0], null);
            Double avg = uid != null ? toDouble(p[1], 0.0) : null;
            if (uid != null && avg != null) prevAvgByUser.put(uid, avg);
        }

        List<LeaderboardRowDto> rows = new ArrayList<>();
        for (Object[] r : cur) {
            if (r == null || r.length < 4) continue;
            Long userId = toLong(r[0], null);
            if (userId == null) continue;
            double avg = toDouble(r[1], 0.0);
            long completionCount = toLong(r[2], 0L);
            Double bestScore = r.length > 4 ? toDoubleOrNull(r[3]) : null;
            Object tsObj = r.length > 4 ? r[4] : r[3];
            double prevAvg = prevAvgByUser.getOrDefault(userId, 0.0);
            UserEntity user = userService.findById(userId).orElseThrow(() -> new RuntimeException("user not found"));
            rows.add(LeaderboardRowDto.builder()
                    .userId(userId)
                    .name(user.getName())
                    .avatar(null)
                    .avgScore(round2(avg))
                    .completionCount(completionCount)
                    .bestScore(bestScore != null ? round2(bestScore) : null)
                    .improvementRate(round2(avg - prevAvg))
                    .timestamp(tsObj)
                    .build());
        }
        rows.sort(Comparator.comparingDouble(LeaderboardRowDto::getAvgScore).reversed());
        return Map.of("rows", rows);
    }

    /**
     * Leaderboard for an arbitrary date range (admin). One ranking over the whole period.
     */
    public Map<String, Object> getLeaderboardByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            return Map.of("rows", List.<LeaderboardRowDto>of());
        }
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        List<Object[]> cur = iseDailyEntryRepository.aggregateUserStatsByDateRange(start, end);
        List<LeaderboardRowDto> rows = new ArrayList<>();
        for (Object[] r : cur) {
            if (r == null || r.length < 4) continue;
            Long userId = toLong(r[0], null);
            if (userId == null) continue;
            double avg = toDouble(r[1], 0.0);
            long completionCount = toLong(r[2], 0L);
            Double bestScore = r.length > 4 ? toDoubleOrNull(r[3]) : null;
            Object tsObj = r.length > 4 ? r[4] : r[3];
            UserEntity userEntity = userService.findById(userId).orElseThrow(() -> new RuntimeException("user not found"));
            rows.add(LeaderboardRowDto.builder()
                    .userId(userId)
                    .name(userEntity.getName())
                    .avatar(null)
                    .avgScore(round2(avg))
                    .completionCount(completionCount)
                    .bestScore(bestScore != null ? round2(bestScore) : null)
                    .improvementRate(0.0)
                    .timestamp(tsObj)
                    .build());
        }
        rows.sort(Comparator.comparingDouble(LeaderboardRowDto::getAvgScore).reversed());
        return Map.of("rows", rows);
    }

    public Map<String, Object> getLessonLeaderboard(Long lessonId, LocalDate date) {
        List<Map<String, Object>> raw = leaderboardService.getLessonLeaderboard(lessonId, date);
        List<LessonLeaderboardRowDto> rows = raw.stream()
                .filter(m -> m.get("userId") != null)
                .map(m -> LessonLeaderboardRowDto.builder()
                        .userId(numLong(m.get("userId"), 0L))
                        .name(m.get("name") != null ? (String) m.get("name") : "")
                        .avatar(m.get("avatar"))
                        .avgScore(numDouble(m.get("avgScore"), 0.0))
                        .attempts(numInt(m.get("attempts"), 0))
                        .bestScore(numDouble(m.get("bestScore"), 0.0))
                        .build())
                .collect(Collectors.toList());
        return Map.of("rows", rows);
    }

    private static long numLong(Object o, long fallback) {
        if (o == null) return fallback;
        if (o instanceof Number) return ((Number) o).longValue();
        return fallback;
    }

    private static double numDouble(Object o, double fallback) {
        if (o == null) return fallback;
        if (o instanceof Number) return ((Number) o).doubleValue();
        return fallback;
    }

    private static int numInt(Object o, int fallback) {
        if (o == null) return fallback;
        if (o instanceof Number) return ((Number) o).intValue();
        return fallback;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static LocalDate toLocalDate(Object o) {
        if (o == null) return null;
        if (o instanceof java.sql.Date) return ((java.sql.Date) o).toLocalDate();
        if (o instanceof LocalDate) return (LocalDate) o;
        try {
            return LocalDate.parse(o.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private static double toDouble(Object o, double def) {
        if (o instanceof Number) return ((Number) o).doubleValue();
        return def;
    }

    private static Double toDoubleOrNull(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).doubleValue();
        return null;
    }

    private static int toInt(Object primary, Object fallback, int def) {
        if (primary instanceof Number) return ((Number) primary).intValue();
        if (fallback instanceof Number) return ((Number) fallback).intValue();
        return def;
    }

    private static long toLong(Object o, long def) {
        if (o instanceof Number) return ((Number) o).longValue();
        return def;
    }

    private static Long toLong(Object o, Long def) {
        if (o == null) return def;
        if (o instanceof Number) return ((Number) o).longValue();
        return def;
    }

    private static List<Long> parseLessonIds(String lessonIdsParam) {
        if (lessonIdsParam == null || lessonIdsParam.isBlank()) return List.of();
        return Arrays.stream(lessonIdsParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try { return Long.parseLong(s); } catch (NumberFormatException e) { return (Long) null; }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
