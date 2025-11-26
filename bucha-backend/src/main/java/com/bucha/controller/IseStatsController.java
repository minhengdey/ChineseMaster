package com.bucha.controller;

import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.IseStatsService;
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
import java.util.*;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/ise/stats")
public class IseStatsController {
        IseStatsService iseStatsService;

        // Daily performance: return per-day aggregates for a date range (default last
        // 30 days)
        @GetMapping("/daily")
        public ResponseEntity<?> dailyStats(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                        @RequestParam(value = "debug", required = false) Boolean debug) {
                try {
                        Map<String, Object> result = iseStatsService.getDailyStats(principal.id(), from, to, debug);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Lesson completion: return per-lesson averages and completion flag
        @GetMapping("/lessons")
        public ResponseEntity<?> lessonStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
                try {
                        Map<String, Object> result = iseStatsService.getLessonStats(principal.id());
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Test stats: return test attempts (testId not null) grouped by testId
        @GetMapping("/tests")
        public ResponseEntity<?> testStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
                try {
                        Map<String, Object> result = iseStatsService.getTestStats(principal.id());
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Pronounced items for a lesson: distinct attempts count + list of pronounced
        // line and vocabulary ids
        @GetMapping("/pronounced")
        public ResponseEntity<?> pronouncedForLesson(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "lessonId") Long lessonId) {
                try {
                        Map<String, Object> result = iseStatsService.getPronouncedForLesson(principal.id(), lessonId);
                        return ResponseEntity.ok(result);
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Return distinct vocabulary ids (across all attempts) for the authenticated
        // user
        @GetMapping("/distinct-vocab")
        public ResponseEntity<?> distinctVocabForUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
                try {
                        Map<String, Object> result = iseStatsService.getDistinctVocabForUser(principal.id());
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Leaderboard: daily across users (optional endpoint used by frontend)
        @GetMapping("/leaderboard/daily")
        public ResponseEntity<?> dailyLeaderboard(
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                try {
                        Map<String, Object> result = iseStatsService.getDailyLeaderboard(date);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Weekly performance: aggregate per-week (Monday start). Default to last 4
        // weeks
        @GetMapping("/weekly")
        public ResponseEntity<?> weeklyStats(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
                try {
                        Map<String, Object> result = iseStatsService.getWeeklyStats(principal.id(), from, to);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Leaderboard: weekly across users
        @GetMapping("/leaderboard/weekly")
        public ResponseEntity<?> weeklyLeaderboard(
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                try {
                        Map<String, Object> result = iseStatsService.getWeeklyLeaderboard(date);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        // Leaderboard for a lesson: top scores per user for the specified lesson and
        // date
        @GetMapping("/leaderboard/lesson")
        public ResponseEntity<?> lessonLeaderboard(@RequestParam(value = "lessonId") Long lessonId,
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                try {
                        Map<String, Object> result = iseStatsService.getLessonLeaderboard(lessonId, date);
                        return ResponseEntity.ok(result);
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }
}
