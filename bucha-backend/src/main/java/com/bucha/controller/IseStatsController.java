package com.bucha.controller;

// import com.bucha.entity.IseScore; // no longer used; SQL aggregation is used instead
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.util.List;
import com.bucha.dto.response.DistinctVocabularyResponse;
import com.bucha.dto.response.WeeklyLeaderboardResponse;
import com.bucha.dto.response.*;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/ise/stats")
public class IseStatsController {
        IseStatsService iseStatsService;
        static final Logger logger = LoggerFactory.getLogger(IseStatsController.class);

        // Daily performance: return per-day aggregates for a date range (default last
        // 30 days)
        @GetMapping("/daily")
        public ResponseEntity<?> dailyStats(@AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                        @RequestParam(value = "debug", required = false) Boolean debug) {
                Long userId = principal.id();
                if (Boolean.TRUE.equals(debug)) {
                        return ResponseEntity.ok(iseStatsService.getDailyStatsDebug(userId, from, to));
                }
                return ResponseEntity.ok(iseStatsService.getDailyStats(userId, from, to));
        }

        // Lesson completion: return per-lesson averages and completion flag
        @GetMapping("/lessons")
        public ResponseEntity<List<LeaderboardRowResponse>> lessonStats(
                        @AuthenticationPrincipal JwtUserPrincipal principal) {
                return ResponseEntity.ok(iseStatsService.getLessonStats(principal.id()));
        }

        // Test stats: return test attempts (testId not null) grouped by testId
        @GetMapping("/tests")
        public ResponseEntity<List<TestStatsRowResponse>> testStats(
                        @AuthenticationPrincipal JwtUserPrincipal principal) {
                return ResponseEntity.ok(iseStatsService.getTestStats(principal.id()));
        }

        // Pronounced items for a lesson: distinct attempts count + list of pronounced
        // line and vocabulary ids
        @GetMapping("/pronounced")
        public ResponseEntity<PronouncedLessonStatsResponse> pronouncedForLesson(
                        @AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "lessonId") Long lessonId) {
                if (lessonId == null)
                        return ResponseEntity.badRequest().body(null);
                return ResponseEntity.ok(iseStatsService.getPronouncedForLesson(principal.id(), lessonId));
        }

        // Return distinct vocabulary ids (across all attempts) for the authenticated
        // user
        @GetMapping("/distinct-vocab")
        public ResponseEntity<DistinctVocabularyResponse> distinctVocabForUser(
                        @AuthenticationPrincipal JwtUserPrincipal principal) {
                return ResponseEntity.ok(iseStatsService.getDistinctVocabForUser(principal.id()));
        }

        // Leaderboard: daily across users (optional endpoint used by frontend)
        @GetMapping("/leaderboard/daily")
        public ResponseEntity<List<LeaderboardRowResponse>> dailyLeaderboard(
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                return ResponseEntity.ok(iseStatsService.getDailyLeaderboard(date));
        }

        // Weekly performance: aggregate per-week (Monday start). Default to last 4
        // weeks
        @GetMapping("/weekly")
        public ResponseEntity<List<PeriodStatRowResponse>> weeklyStats(
                        @AuthenticationPrincipal JwtUserPrincipal principal,
                        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
                return ResponseEntity.ok(iseStatsService.getWeeklyStats(principal.id(), from, to));
        }

        // Leaderboard: weekly across users
        @GetMapping("/leaderboard/weekly")
        public ResponseEntity<WeeklyLeaderboardResponse> weeklyLeaderboard(
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                return ResponseEntity.ok(iseStatsService.getWeeklyLeaderboard(date));
        }

        // Leaderboard for a lesson: top scores per user for the specified lesson and
        // date
        @GetMapping("/leaderboard/lesson")
        public ResponseEntity<List<LeaderboardRowResponse>> lessonLeaderboard(
                        @RequestParam(value = "lessonId") Long lessonId,
                        @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                return ResponseEntity.ok(iseStatsService.getLessonLeaderboard(lessonId, date));
        }
}
