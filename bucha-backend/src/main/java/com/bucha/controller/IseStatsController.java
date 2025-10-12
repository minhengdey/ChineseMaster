package com.bucha.controller;

import com.bucha.entity.IseScore;
import com.bucha.repository.IseRepository;
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

        List<IseScore> scores = iseRepository.findByUser_IdAndIncludeInDailyTrueAndSessionDateBetween(userId, start,
                end);

        // group by date
        Map<LocalDate, List<IseScore>> grouped = scores.stream()
                .collect(Collectors.groupingBy(s -> s.getSessionDate().toLocalDate()));

        List<Map<String, Object>> rows = new ArrayList<>();
        LocalDate d = startDate;
        while (!d.isAfter(endDate)) {
            List<IseScore> list = grouped.getOrDefault(d, Collections.emptyList());
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average()
                    .orElse(0.0);
            int count = list.size();
            double duration = list.stream().mapToDouble(s -> Optional.ofNullable(s.getDurationSeconds()).orElse(0.0))
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
        List<IseScore> scores = iseRepository.findByUser_IdAndLessonIdIsNotNull(userId);

        Map<Long, List<IseScore>> grouped = scores.stream().filter(s -> s.getLessonId() != null)
                .collect(Collectors.groupingBy(IseScore::getLessonId));

        List<Map<String, Object>> rows = grouped.entrySet().stream().map(e -> {
            Long lessonId = e.getKey();
            List<IseScore> list = e.getValue();
            double avg = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0)).average()
                    .orElse(0.0);
            boolean completed = list.size() >= 4; // heuristic: at least 4 recorded parts (声母,韵母,声调,句子)
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
        List<IseScore> scores = iseRepository.findByUser_IdAndTestIdIsNotNull(userId);

        Map<Long, List<IseScore>> grouped = scores.stream().filter(s -> s.getTestId() != null)
                .collect(Collectors.groupingBy(IseScore::getTestId));

        List<Map<String, Object>> rows = grouped.entrySet().stream().map(e -> {
            Long testId = e.getKey();
            List<IseScore> list = e.getValue();
            // For each testId, compute average by applying configured formula if components
            // are present
            double avgTotal = list.stream().mapToDouble(s -> Optional.ofNullable(s.getTotalScore()).orElse(0.0))
                    .average().orElse(0.0);
            Map<String, Object> row = new HashMap<>();
            row.put("testId", testId);
            row.put("avgTotal", Math.round(avgTotal * 100.0) / 100.0);
            row.put("attempts", list.size());
            // include raw entries for FE if needed
            row.put("entries", list.stream().map(s -> Map.of(
                    "id", s.getId(),
                    "totalScore", s.getTotalScore(),
                    "accuracy", s.getAccuracy(),
                    "fluency", s.getFluency(),
                    "completeness", s.getCompleteness(),
                    "sessionDate", s.getSessionDate().toString())).collect(Collectors.toList()));
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("rows", rows));
    }
}
