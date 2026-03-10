package com.bucha.controller;

import com.bucha.dto.ise.DistinctVocabResponseDto;
import com.bucha.dto.ise.PronouncedForLessonDto;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.IseStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/ise/stats")
@RequiredArgsConstructor
@Slf4j
public class IseStatsController {

    private final IseStatsService iseStatsService;

    @GetMapping("/daily")
    public ResponseEntity<?> dailyStats(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        try {
            return ResponseEntity.ok(iseStatsService.getDailyStats(principal.id(), from, to));
        } catch (Exception e) {
            log.debug("failed to compute daily stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "failed to compute daily stats"));
        }
    }

    @GetMapping("/lessons")
    public ResponseEntity<?> lessonStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(iseStatsService.getLessonStats(principal.id()));
    }

    @GetMapping("/tests")
    public ResponseEntity<?> testStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(iseStatsService.getTestStats(principal.id()));
    }

    @GetMapping("/pronounced-batch")
    public ResponseEntity<Map<String, PronouncedForLessonDto>> pronouncedBatch(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "lessonIds", required = false) String lessonIdsParam) {
        return ResponseEntity.ok(iseStatsService.getPronouncedBatch(principal.id(), lessonIdsParam));
    }

    @GetMapping("/pronounced")
    public ResponseEntity<?> pronouncedForLesson(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "lessonId") Long lessonId) {
        if (lessonId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "lessonId is required"));
        }
        PronouncedForLessonDto dto = iseStatsService.computePronouncedForLesson(principal.id(), lessonId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/distinct-vocab")
    public ResponseEntity<?> distinctVocabForUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
        try {
            DistinctVocabResponseDto dto = iseStatsService.getDistinctVocabForUser(principal.id());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.debug("failed to get distinct vocab ids for user {}", principal.id(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "failed to fetch distinct vocabulary ids"));
        }
    }

    @GetMapping("/leaderboard/daily")
    public ResponseEntity<?> dailyLeaderboard(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(iseStatsService.getDailyLeaderboard(date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<?> weeklyStats(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        try {
            Map<String, Object> result = iseStatsService.getWeeklyStats(principal.id(), from, to);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.debug("failed to compute weekly stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "failed to compute weekly stats"));
        }
    }

    @GetMapping("/leaderboard/weekly")
    public ResponseEntity<?> weeklyLeaderboard(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            return ResponseEntity.ok(iseStatsService.getWeeklyLeaderboard(date));
        } catch (Exception e) {
            log.debug("failed to compute weekly leaderboard", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "failed to compute weekly leaderboard"));
        }
    }

    @GetMapping("/leaderboard/lesson")
    public ResponseEntity<?> lessonLeaderboard(
            @RequestParam(value = "lessonId") Long lessonId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (lessonId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "lessonId is required"));
        }
        try {
            return ResponseEntity.ok(iseStatsService.getLessonLeaderboard(lessonId, date));
        } catch (Exception e) {
            log.warn("failed to compute lesson leaderboard for lessonId={}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "failed to compute lesson leaderboard", "message", e.getMessage() != null ? e.getMessage() : ""));
        }
    }
}
