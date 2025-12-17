package com.bucha.controller;

import com.bucha.dto.AdminStatsDtos.LessonLeaderboard;
import com.bucha.dto.AdminStatsDtos.TestLeaderboard;
import com.bucha.dto.AdminStatsDtos.WeeklyLeaderboard;
import com.bucha.dto.AdminStatsDtos.ExamLeaderboard;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.AdminStatsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    AdminStatsService adminStatsService;

    @GetMapping("/leaderboard/weekly")
    public ResponseEntity<?> weeklyLeaderboard(@AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(value = "startDate", required = false) java.time.LocalDate startDate,
            @RequestParam(value = "endDate", required = false) java.time.LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "startDate và endDate là bắt buộc"));
        }
        List<WeeklyLeaderboard> weeks = adminStatsService.getWeeklyLeaderboards(startDate, endDate);
        return ResponseEntity.ok(Map.of("weeks", weeks));
    }

    @GetMapping("/leaderboard/lessons")
    public ResponseEntity<?> lessonLeaderboard(@AuthenticationPrincipal JwtUserPrincipal principal) {
        List<LessonLeaderboard> lessons = adminStatsService.getLessonLeaderboards();
        return ResponseEntity.ok(Map.of("lessons", lessons));
    }

    @GetMapping("/leaderboard/tests")
    public ResponseEntity<?> testLeaderboard(@AuthenticationPrincipal JwtUserPrincipal principal) {
        List<TestLeaderboard> tests = adminStatsService.getTestLeaderboards();
        return ResponseEntity.ok(Map.of("tests", tests));
    }

    @GetMapping("/leaderboard/exams")
    public ResponseEntity<?> examLeaderboard(@AuthenticationPrincipal JwtUserPrincipal principal) {
        List<ExamLeaderboard> exams = adminStatsService.getExamLeaderboards();
        return ResponseEntity.ok(Map.of("exams", exams));
    }
}
