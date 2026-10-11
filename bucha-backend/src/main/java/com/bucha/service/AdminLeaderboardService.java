package com.bucha.service;

import com.bucha.entity.Lesson;
import com.bucha.entity.UserExamResult;
import com.bucha.repository.ExamRepository;
import com.bucha.repository.LessonRepository;
import com.bucha.repository.UserExamResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminLeaderboardService {

    private final LessonRepository lessonRepository;
    private final ExamRepository examRepository;
    private final UserExamResultRepository userExamResultRepository;
    private final IseStatsService iseStatsService;

    /**
     * All lessons with per-lesson leaderboard rows for admin dashboard.
     * Response: { "lessons": [ { "lessonId", "lessonTitle", "rows": [...] }, ... ] }
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getLessonLeaderboards() {
        Sort sort = Sort.by("curriculum.id").and(Sort.by("order"));
        List<Lesson> lessons = lessonRepository.findAll(sort);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Lesson lesson : lessons) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("lessonId", lesson.getId());
            item.put("lessonTitle", lesson.getTitle());
            try {
                Map<String, Object> lb = iseStatsService.getLessonLeaderboard(lesson.getId(), null);
                Object rows = lb.get("rows");
                item.put("rows", rows != null ? rows : List.of());
            } catch (Exception e) {
                item.put("rows", List.of());
            }
            list.add(item);
        }
        return Map.of("lessons", list);
    }

    /**
     * All exams with per-exam leaderboard rows (by latest totalScore) for admin dashboard.
     * Response: { "exams": [ { "testId", "title", "rows": [ { "rank", "userId", "name", "email", "totalScore", ... } ] }, ... ] }
     */
    public Map<String, Object> getExamLeaderboards() {
        List<Map<String, Object>> examsList = new ArrayList<>();
        examRepository.findAllByOrderAsc().forEach(exam -> {
            Map<String, Object> examItem = new LinkedHashMap<>();
            examItem.put("testId", exam.getExternalId());
            examItem.put("title", exam.getTitle());
            List<UserExamResult> results = userExamResultRepository.findByExamIdOrderByTotalScoreDesc(exam.getId());
            List<Map<String, Object>> rows = new ArrayList<>();
            int rank = 1;
            for (UserExamResult uer : results) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("rank", rank++);
                row.put("userId", uer.getUser() != null ? uer.getUser().getId() : null);
                row.put("name", uer.getUser() != null ? uer.getUser().getName() : null);
                row.put("email", uer.getUser() != null ? uer.getUser().getEmail() : null);
                row.put("initialScore", uer.getInitialScore());
                row.put("finalScore", uer.getFinalScore());
                row.put("toneScore", uer.getToneScore());
                row.put("sentenceScore", uer.getSentenceScore());
                row.put("totalScore", uer.getTotalScore());
                rows.add(row);
            }
            examItem.put("rows", rows);
            examsList.add(examItem);
        });
        return Map.of("exams", examsList);
    }

    /**
     * BXH trong khoảng thời gian (admin): một bảng xếp hạng cho cả khoảng startDate → endDate,
     * không chia theo tuần. Trả về { "weeks": [ { "weekIndex", "weekStart", "weekEnd", "rows": [...] } ] }
     * với một phần tử duy nhất (để frontend giữ format).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getWeeklyLeaderboards(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            return Map.of("weeks", List.of());
        }
        Map<String, Object> single = new LinkedHashMap<>();
        single.put("weekIndex", 0);
        single.put("weekStart", startDate.toString());
        single.put("weekEnd", endDate.toString());
        try {
            Map<String, Object> lb = iseStatsService.getLeaderboardByDateRange(startDate, endDate);
            Object rows = lb.get("rows");
            single.put("rows", rows != null ? rows : List.of());
        } catch (Exception e) {
            single.put("rows", List.of());
        }
        return Map.of("weeks", List.of(single));
    }
}
