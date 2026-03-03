package com.bucha.controller;

import com.bucha.service.AdminLeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/leaderboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLeaderboardController {

    private final AdminLeaderboardService adminLeaderboardService;

    @GetMapping("/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyLeaderboards(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(adminLeaderboardService.getWeeklyLeaderboards(startDate, endDate));
    }

    @GetMapping("/lessons")
    public ResponseEntity<Map<String, Object>> getLessonLeaderboards() {
        return ResponseEntity.ok(adminLeaderboardService.getLessonLeaderboards());
    }

    @GetMapping("/exams")
    public ResponseEntity<Map<String, Object>> getExamLeaderboards() {
        return ResponseEntity.ok(adminLeaderboardService.getExamLeaderboards());
    }
}
