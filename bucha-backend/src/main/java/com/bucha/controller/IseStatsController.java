package com.bucha.controller;

import com.bucha.entity.IseScore;
import com.bucha.entity.UserLesson;
import com.bucha.repository.*;
import com.bucha.security.JwtUserPrincipal;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
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
        static final Logger logger = LoggerFactory.getLogger(IseStatsController.class);

        // Daily performance: return per-day aggregates for a date range (default last
        // 30 days)
        @GetMapping("/daily")
        public ResponseEntity<?> dailyStats(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
                Long userId = principal.id();
                LocalDate endDate = (to != null) ? to : LocalDate.now();
                LocalDate startDate = (from != null) ? from : endDate.minusDays(29);

                LocalDateTime start = startDate.atStartOfDay();
                LocalDateTime end = endDate.atTime(LocalTime.MAX);

                List<com.bucha.entity.IseDailyEntry> entries = iseDailyEntryRepository
                                .findByUser_IdAndSessionDateBetween(userId, start, end);

                List<IseScore> scores;
                if (entries == null || entries.isEmpty()) {
                        // fallback to previous behavior in case summary entries are not yet present
                        logger.debug("[IseStatsController] no daily summary entries found for user {} between {} and {}; falling back to ise_score",
                                        userId, start, end);
                        scores = iseRepository.findByUser_IdAndIncludeInDailyTrueAndSessionDateBetween(userId, start,
                                        end);
                        logger.debug("[IseStatsController] fallback ise_score count={} for user {}",
                                        scores == null ? 0 : scores.size(), userId);
                        if (scores != null && scores.size() > 0) {
                                int sample = Math.min(3, scores.size());
                                List<String> dates = scores.subList(0, sample).stream()
                                                .map(s -> s.getSessionDate() == null ? "null"
                                                                : s.getSessionDate().toString())
                                                .collect(Collectors.toList());
                                logger.debug("[IseStatsController] sample sessionDates from ise_score: {}", dates);
                        }
                } else {
                        // convert entries into score-like objects for aggregation compatibility
                        logger.debug("[IseStatsController] found {} daily summary entries for user {}", entries.size(),
                                        userId);
                        int sample = Math.min(3, entries.size());
                        List<String> dates = entries.subList(0, sample).stream()
                                        .map(e -> e.getSessionDate() == null ? "null" : e.getSessionDate().toString())
                                        .collect(Collectors.toList());
                        logger.debug("[IseStatsController] sample sessionDates from daily entries: {}", dates);
                        scores = entries.stream().map(e -> {
                                IseScore s = new IseScore();
                                s.setTotalScore(e.getTotalScore());
                                s.setDurationSeconds(e.getDurationSeconds());
                                s.setSessionDate(e.getSessionDate());
                                return s;
                        }).collect(Collectors.toList());
                }

                // group by date
                Map<LocalDate, List<IseScore>> grouped = scores.stream()
                                .collect(Collectors.groupingBy(s -> s.getSessionDate().toLocalDate()));

                List<Map<String, Object>> rows = new ArrayList<>();
                LocalDate d = startDate;
                while (!d.isAfter(endDate)) {
                        List<IseScore> list = grouped.getOrDefault(d, Collections.emptyList());
                        double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                                        .average()
                                        .orElse(0.0);
                        int count = list.size();
                        double duration = list.stream()
                                        .mapToDouble(s -> Optional.ofNullable(s.getDurationSeconds()).orElse(0.0))
                                        .sum();
                        Map<String, Object> row = new HashMap<>();
                        row.put("date", d.toString());
                        row.put("avgScore", Math.round(avg * 100.0) / 100.0);
                        row.put("count", count);
                        row.put("durationSeconds", Math.round(duration));
                        rows.add(row);
                        d = d.plusDays(1);
                }

                return ResponseEntity.ok(Map.of("rows", rows));
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

                out.put("lineIds", lineIds == null ? Collections.emptyList() : lineIds);
                out.put("vocabularyIds", vocabIds == null ? Collections.emptyList() : vocabIds);
                out.put("distinctLineCount", distinctLineCount);
                out.put("distinctVocabularyCount", distinctVocabCount);
                out.put("pronouncedCount", pronouncedCount);

                logger.info("out: " + out.toString());

                return ResponseEntity.ok(out);
        }
}
