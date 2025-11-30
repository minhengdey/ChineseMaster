package com.bucha.controller;

import com.bucha.entity.UserEntity;
import com.bucha.entity.UserLesson;
import com.bucha.repository.*;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.LeaderboardService;
import com.bucha.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/ise/stats")
public class IseStatsController {
        IseRepository iseRepository;
        IseDailyEntryRepository iseDailyEntryRepository;
        IseLessonEntryRepository iseLessonEntryRepository;
        IseTestEntryRepository iseTestEntryRepository;
        UserLessonRepository userLessonRepository;
        UserService userService;
        LeaderboardService leaderboardService;
        JdbcTemplate jdbcTemplate;
        static final Logger logger = LoggerFactory.getLogger(IseStatsController.class);

        // Daily performance: return per-day aggregates for a date range (default last
        // 30 days)
        @GetMapping("/daily")
        public ResponseEntity<?> dailyStats(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                        @RequestParam(value = "debug", required = false) Boolean debug) {
                Long userId = principal.id();
                LocalDate endDate = (to != null) ? to : LocalDate.now();
                LocalDate startDate = (from != null) ? from : endDate.minusDays(29);

                LocalDateTime start = startDate.atStartOfDay();
                LocalDateTime end = endDate.atTime(LocalTime.MAX);

                // Use SQL aggregation to compute per-day averages/count/duration for the user
                try {
                        String sql = "SELECT DATE(session_date) AS day, AVG(total_score) AS avg_score, "
                                        + "COUNT(DISTINCT attempt_id) AS cnt_attempts, COUNT(*) AS cnt_rows, SUM(duration_seconds) AS duration_sum "
                                        + "FROM ise_daily_entry ide "
                                        + "WHERE ide.user_id = ? AND ide.session_date BETWEEN ? AND ? "
                                        + "GROUP BY DATE(session_date)";

                        List<Map<String, Object>> sqlRows = jdbcTemplate.queryForList(sql,
                                        userId, start, end);

                        // convert sqlRows into a map for quick lookup (accept either 'day' or 'date'
                        // key)
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
                                        // safe extraction from SQL result (accept both snake_case and camelCase keys)
                                        Number avgNum = (Number) (r.getOrDefault("avg_score", r.get("avgScore")));
                                        double avgVal = (avgNum == null) ? 0.0 : avgNum.doubleValue();
                                        Number cntAttemptsNum = (Number) (r.getOrDefault("cnt_attempts",
                                                        r.get("cnt_attempts")));
                                        Number cntRowsNum = (Number) (r.getOrDefault("cnt_rows", r.get("cnt_rows")));
                                        int cntVal = 0;
                                        if (cntAttemptsNum != null)
                                                cntVal = cntAttemptsNum.intValue();
                                        else if (cntRowsNum != null)
                                                cntVal = cntRowsNum.intValue();
                                        Number durNum = (Number) (r.getOrDefault("duration_sum",
                                                        r.get("durationSeconds")));
                                        long durVal = (durNum == null) ? 0L : durNum.longValue();
                                        out.put("avgScore", Math.round(avgVal * 100.0) / 100.0);
                                        out.put("count", cntVal);
                                        out.put("durationSeconds", durVal);
                                        rows.add(out);
                                }
                                d = d.plusDays(1);
                        }

                        if (Boolean.TRUE.equals(debug)) {
                                // include raw SQL rows for troubleshooting when debug=true
                                return ResponseEntity.ok(Map.of("rows", rows, "sqlRows", sqlRows));
                        }
                        return ResponseEntity.ok(Map.of("rows", rows));
                } catch (Exception e) {
                        logger.debug("failed to compute daily stats by SQL, falling back to in-memory", e);
                        return ResponseEntity.status(500).body(Map.of("error", "failed to compute daily stats"));
                }
        }

        // Lesson completion: return per-lesson averages and completion flag
        @GetMapping("/lessons")
        public ResponseEntity<?> lessonStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
                Long userId = principal.id();
                List<com.bucha.entity.IseLessonEntry> lessonEntries = iseLessonEntryRepository.findByUser_Id(userId);
                Map<Long, List<com.bucha.entity.IseLessonEntry>> grouped = lessonEntries.stream()
                                .filter(e -> e.getLessonId() != null)
                                .collect(Collectors.groupingBy(com.bucha.entity.IseLessonEntry::getLessonId));

                List<Map<String, Object>> rows = grouped.entrySet().stream().map(e -> {
                        Long lessonId = e.getKey();
                        List<com.bucha.entity.IseLessonEntry> list = e.getValue();
                        double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                                        .average()
                                        .orElse(0.0);
                        UserLesson userLesson = userLessonRepository.findByUser_IdAndLesson_Id(userId, lessonId)
                                        .orElse(null);
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

                return ResponseEntity.ok(Map.of("rows", rows));
        }

        // Test stats: return test attempts (testId not null) grouped by testId
        @GetMapping("/tests")
        public ResponseEntity<?> testStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
                Long userId = principal.id();
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
                                        "sessionDate",
                                        s.getSessionDate() == null ? null : s.getSessionDate().toString()))
                                        .collect(Collectors.toList()));
                        return row;
                }).collect(Collectors.toList());

                return ResponseEntity.ok(Map.of("rows", rows));
        }

        // Pronounced items for a lesson: distinct attempts count + list of pronounced
        // line and vocabulary ids
        @GetMapping("/pronounced")
        public ResponseEntity<?> pronouncedForLesson(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "lessonId") Long lessonId) {
                Long userId = principal.id();
                if (lessonId == null)
                        return ResponseEntity.badRequest().body(Map.of("error", "lessonId is required"));

                List<Long> lineIds = iseDailyEntryRepository.findDistinctLineIdsByUserAndLesson(userId, lessonId);
                List<Long> vocabIds = iseDailyEntryRepository.findDistinctVocabularyIdsByUserAndLesson(userId,
                                lessonId);

                Map<String, Object> out = new HashMap<>();
                int distinctLineCount = (lineIds == null) ? 0 : lineIds.size();
                int distinctVocabCount = (vocabIds == null) ? 0 : vocabIds.size();
                int pronouncedCount = distinctLineCount + distinctVocabCount;

                // Return external ids as strings to avoid JavaScript numeric precision loss in
                // clients
                List<String> lineIdStrs = (lineIds == null) ? Collections.emptyList()
                                : lineIds.stream().map(String::valueOf).collect(Collectors.toList());
                List<String> vocabIdStrs = (vocabIds == null) ? Collections.emptyList()
                                : vocabIds.stream().map(String::valueOf).collect(Collectors.toList());
                out.put("lineIds", lineIdStrs);
                out.put("vocabularyIds", vocabIdStrs);
                out.put("distinctLineCount", distinctLineCount);
                out.put("distinctVocabularyCount", distinctVocabCount);
                out.put("pronouncedCount", pronouncedCount);

                // Compute average per-vocabulary and per-line as requested:
                // For each distinct vocabulary_id, compute average(total_score) across attempts
                // for that vocabulary_id;
                // then avgWordScore = mean of those per-vocabulary averages.
                // Same for line_id.
                try {
                        List<com.bucha.entity.IseLessonEntry> lessonEntriesAll = iseLessonEntryRepository
                                        .findByUser_IdAndLessonId(userId, lessonId);
                        // group by vocabularyId and lineId
                        Map<Long, List<com.bucha.entity.IseLessonEntry>> byVocab = lessonEntriesAll.stream()
                                        .filter(e -> e.getVocabularyId() != null)
                                        .collect(Collectors
                                                        .groupingBy(com.bucha.entity.IseLessonEntry::getVocabularyId));

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

                return ResponseEntity.ok(out);
        }

        // Return distinct vocabulary ids (across all attempts) for the authenticated
        // user
        @GetMapping("/distinct-vocab")
        public ResponseEntity<?> distinctVocabForUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
                Long userId = principal.id();
                try {
                        List<Long> ids = iseRepository.findDistinctVocabularyIdsByUser(userId);
                        List<String> strIds = (ids == null) ? Collections.emptyList()
                                        : ids.stream().map(String::valueOf).collect(Collectors.toList());
                        return ResponseEntity.ok(Map.of("vocabularyIds", strIds, "count", strIds.size()));
                } catch (Exception e) {
                        logger.debug("failed to get distinct vocab ids for user {}", userId, e);
                        return ResponseEntity.status(500)
                                        .body(Map.of("error", "failed to fetch distinct vocabulary ids"));
                }
        }

        // Leaderboard: daily across users (optional endpoint used by frontend)
        @GetMapping("/leaderboard/daily")
        public ResponseEntity<?> dailyLeaderboard(
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                LocalDate target = (date != null) ? date : LocalDate.now();
                LocalDateTime start = target.atStartOfDay();
                LocalDateTime end = target.atTime(LocalTime.MAX);

                // aggregate per user using iseDailyEntryRepository
                List<com.bucha.entity.IseDailyEntry> entries = iseDailyEntryRepository.findBySessionDateBetween(start,
                                end);

                // group by user id
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
                        // improvement vs yesterday: compute yesterday avg for same user
                        LocalDate y = target.minusDays(1);
                        LocalDateTime ys = y.atStartOfDay();
                        LocalDateTime ye = y.atTime(LocalTime.MAX);
                        List<com.bucha.entity.IseDailyEntry> yEntries = iseDailyEntryRepository
                                        .findByUser_IdAndSessionDateBetween(userId, ys, ye);
                        double yAvg = yEntries.stream()
                                        .mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average()
                                        .orElse(0.0);
                        double improvement = Math.round((avg - yAvg) * 100.0) / 100.0; // percent points
                        UserEntity user = userService.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("user not found"));

                        Map<String, Object> row = new HashMap<>();
                        row.put("userId", userId);
                        // try to include display name/avatar if available via userLessonRepository or
                        // other repo; fallback to id only
                        row.put("name", user.getName());
                        row.put("avatar", null);
                        row.put("avgScore", Math.round(avg * 100.0) / 100.0);
                        row.put("completionCount", completionCount);
                        row.put("improvementRate", improvement);
                        row.put("timestamp", list.stream().map(e -> e.getCreatedAt()).min(LocalDateTime::compareTo)
                                        .orElse(null));
                        rows.add(row);
                }

                return ResponseEntity.ok(Map.of("rows", rows));
        }

        // Weekly performance: aggregate per-week (Monday start). Default to last 4
        // weeks
        @GetMapping("/weekly")
        public ResponseEntity<?> weeklyStats(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
                Long userId = principal.id();
                LocalDate endDate = (to != null) ? to : LocalDate.now();
                LocalDate startDate = (from != null) ? from : endDate.minusWeeks(3);

                // align startDate to the Monday of that week
                LocalDate iterStart = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate iterEnd = endDate;

                LocalDateTime start = iterStart.atStartOfDay();
                LocalDateTime end = iterEnd.atTime(LocalTime.MAX);

                // Use SQL to get per-day aggregates in range and then fold into weekly buckets
                // (Monday start)
                try {
                        String sql = "SELECT DATE(session_date) AS day, AVG(total_score) AS avg_score, "
                                        + "COUNT(DISTINCT attempt_id) AS cnt_attempts, COUNT(*) AS cnt_rows, SUM(duration_seconds) AS duration_sum "
                                        + "FROM ise_daily_entry ide "
                                        + "WHERE ide.user_id = ? AND ide.session_date BETWEEN ? AND ? "
                                        + "GROUP BY DATE(session_date)";

                        List<Map<String, Object>> sqlRows = jdbcTemplate.queryForList(sql,
                                        userId, start, end);

                        // map day -> {avgScore, count, duration} (use null-safe extraction)
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
                                Number cntAttemptsNum = (Number) (r.getOrDefault("cnt_attempts",
                                                r.get("cnt_attempts")));
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

                        List<Map<String, Object>> rows = new ArrayList<>();
                        LocalDate d = iterStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                        while (!d.isAfter(iterEnd)) {
                                // collect days in this week
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

                        return ResponseEntity.ok(Map.of("rows", rows));
                } catch (Exception e) {
                        logger.debug("failed to compute weekly stats by SQL, falling back to in-memory", e);
                        return ResponseEntity.status(500).body(Map.of("error", "failed to compute weekly stats"));
                }
        }

        // Leaderboard: weekly across users
        @GetMapping("/leaderboard/weekly")
        public ResponseEntity<?> weeklyLeaderboard(
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                LocalDate target = (date != null) ? date : LocalDate.now();
                LocalDate weekStart = target.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDateTime start = weekStart.atStartOfDay();
                LocalDateTime end = weekStart.plusDays(6).atTime(LocalTime.MAX);

                try {
                        String sql = "SELECT ide.user_id as user_id, AVG(ide.total_score) as avg_score, COUNT(*) as cnt, MIN(ide.created_at) as ts "
                                        + "FROM ise_daily_entry ide "
                                        + "WHERE ide.session_date BETWEEN ? AND ? "
                                        + "GROUP BY ide.user_id";

                        List<Map<String, Object>> cur = jdbcTemplate.queryForList(sql, start,
                                        end);

                        // previous week
                        LocalDate prevWeekStart = weekStart.minusWeeks(1);
                        LocalDateTime pys = prevWeekStart.atStartOfDay();
                        LocalDateTime pye = prevWeekStart.plusDays(6).atTime(LocalTime.MAX);
                        List<Map<String, Object>> prev = jdbcTemplate.queryForList(sql, pys,
                                        pye);

                        Map<Long, Double> prevAvgByUser = new HashMap<>();
                        for (Map<String, Object> p : prev) {
                                Number uid = (Number) p.get("user_id");
                                Number avg = (Number) p.get("avg_score");
                                if (uid != null && avg != null)
                                        prevAvgByUser.put(uid.longValue(), avg.doubleValue());
                        }

                        List<Map<String, Object>> rows = new ArrayList<>();
                        for (Map<String, Object> r : cur) {
                                Number uid = (Number) r.get("user_id");
                                if (uid == null)
                                        continue;
                                Long userId = uid.longValue();
                                double avg = ((Number) r.get("avg_score")).doubleValue();
                                long completionCount = ((Number) r.get("cnt")).longValue();
                                Object tsObj = r.get("ts");

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

                        return ResponseEntity.ok(Map.of("rows", rows));
                } catch (Exception e) {
                        logger.debug("failed to compute weekly leaderboard by SQL", e);
                        return ResponseEntity.status(500).body(Map.of("error", "failed to compute weekly leaderboard"));
                }
        }

        // Leaderboard for a lesson: top scores per user for the specified lesson and
        // date
        @GetMapping("/leaderboard/lesson")
        public ResponseEntity<?> lessonLeaderboard(@RequestParam(value = "lessonId") Long lessonId,
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                if (lessonId == null)
                        return ResponseEntity.badRequest().body(Map.of("error", "lessonId is required"));

                try {
                        List<Map<String, Object>> rows = leaderboardService.getLessonLeaderboard(lessonId, date);
                        return ResponseEntity.ok(Map.of("rows", rows));
                } catch (Exception e) {
                        logger.debug("failed to compute lesson leaderboard via service", e);
                        return ResponseEntity.status(500).body(Map.of("error", "failed to compute lesson leaderboard"));
                }
        }
}
