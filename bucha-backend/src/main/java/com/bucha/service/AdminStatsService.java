package com.bucha.service;

import com.bucha.dto.AdminStatsDtos.LessonLeaderboard;
import com.bucha.dto.AdminStatsDtos.TestLeaderboard;
import com.bucha.dto.AdminStatsDtos.UserScoreRow;
import com.bucha.dto.AdminStatsDtos.WeeklyLeaderboard;
import com.bucha.dto.AdminStatsDtos.ExamLeaderboard;
import com.bucha.dto.AdminStatsDtos.ExamScoreRow;
import com.bucha.entity.Lesson;
import com.bucha.entity.UserEntity;
import com.bucha.repository.IseDailyEntryRepository;
import com.bucha.repository.IseLessonEntryRepository;
import com.bucha.repository.IseTestEntryRepository;
import com.bucha.repository.LessonRepository;
import com.bucha.repository.UserRepository;
import com.bucha.repository.UserExamResultRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminStatsService {

    IseDailyEntryRepository iseDailyEntryRepository;
    IseLessonEntryRepository iseLessonEntryRepository;
    IseTestEntryRepository iseTestEntryRepository;
    LessonRepository lessonRepository;
    UserRepository userRepository;
    UserExamResultRepository userExamResultRepository;

    public List<WeeklyLeaderboard> getWeeklyLeaderboards(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return Collections.emptyList();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay(); // exclusive end

        List<Object[]> rows = iseDailyEntryRepository.aggregateRangeLeaderboard(start, end);
        Map<Long, UserEntity> users = userRepository.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        List<UserScoreRow> scores = new ArrayList<>();
        for (Object[] r : rows) {
            if (r == null || r.length < 4) {
                continue;
            }
            Object userIdObj = r[0];
            if (userIdObj == null) {
                continue;
            }
            Long userId = ((Number) userIdObj).longValue();
            double avgScore = ((Number) r[1]).doubleValue();
            long attempts = ((Number) r[2]).longValue();
            double bestScore = ((Number) r[3]).doubleValue();

            UserEntity user = users.get(userId);
            String name = (user != null && user.getName() != null) ? user.getName() : String.valueOf(userId);
            String email = (user != null) ? user.getEmail() : null;

            scores.add(new UserScoreRow(userId, name, email, roundTwo(avgScore), attempts, roundTwo(bestScore)));
        }

        List<UserScoreRow> sorted = scores.stream()
                .sorted(Comparator.comparingDouble(UserScoreRow::avgScore).reversed())
                .collect(Collectors.toList());

        // Reuse WeeklyLeaderboard DTO but now it represents the chosen date range
        // instead of fixed weeks
        return List.of(new WeeklyLeaderboard(1, startDate, endDate, sorted));
    }

    public List<TestLeaderboard> getTestLeaderboards() {
        List<Object[]> rows = iseTestEntryRepository.aggregateTestLeaderboard();
        Map<Long, UserEntity> users = userRepository.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        Map<Long, List<UserScoreRow>> perTest = new LinkedHashMap<>();
        for (Object[] r : rows) {
            if (r == null || r.length < 5) {
                continue;
            }
            Object testIdObj = r[0];
            Object userIdObj = r[1];
            if (testIdObj == null || userIdObj == null) {
                continue;
            }
            Long testId = ((Number) testIdObj).longValue();
            Long userId = ((Number) userIdObj).longValue();
            double avgScore = ((Number) r[2]).doubleValue();
            long attempts = ((Number) r[3]).longValue();
            double bestScore = ((Number) r[4]).doubleValue();

            UserEntity user = users.get(userId);
            String name = (user != null && user.getName() != null) ? user.getName() : String.valueOf(userId);
            String email = (user != null) ? user.getEmail() : null;

            perTest.computeIfAbsent(testId, k -> new ArrayList<>())
                    .add(new UserScoreRow(userId, name, email, roundTwo(avgScore), attempts, roundTwo(bestScore)));
        }

        List<TestLeaderboard> result = new ArrayList<>();
        for (Map.Entry<Long, List<UserScoreRow>> entry : perTest.entrySet()) {
            List<UserScoreRow> sorted = entry.getValue().stream()
                    .sorted(Comparator.comparingDouble(UserScoreRow::avgScore).reversed())
                    .collect(Collectors.toList());
            result.add(new TestLeaderboard(entry.getKey(), sorted));
        }
        result.sort(Comparator.comparing(TestLeaderboard::testId));
        return result;
    }

    public List<ExamLeaderboard> getExamLeaderboards() {
        List<Object[]> rows = userExamResultRepository.findExamLeaderboards();

        Map<Long, List<ExamScoreRow>> perExam = new LinkedHashMap<>();
        Map<Long, String> examTitles = new LinkedHashMap<>();

        for (Object[] r : rows) {
            if (r == null || r.length < 10) {
                continue;
            }

            Long examId = r[0] != null ? ((Number) r[0]).longValue() : null;
            String examTitle = r[1] != null ? r[1].toString() : "Bài kiểm tra #" + examId;
            Long userId = r[2] != null ? ((Number) r[2]).longValue() : null;
            String userName = r[3] != null ? r[3].toString() : "User #" + userId;
            String userEmail = r[4] != null ? r[4].toString() : null;
            Double initialScore = r[5] != null ? ((Number) r[5]).doubleValue() : 0.0;
            Double finalScore = r[6] != null ? ((Number) r[6]).doubleValue() : 0.0;
            Double toneScore = r[7] != null ? ((Number) r[7]).doubleValue() : 0.0;
            Double sentenceScore = r[8] != null ? ((Number) r[8]).doubleValue() : 0.0;
            Double totalScore = r[9] != null ? ((Number) r[9]).doubleValue() : 0.0;

            if (examId == null || userId == null) {
                continue;
            }

            examTitles.put(examId, examTitle);

            perExam.computeIfAbsent(examId, k -> new ArrayList<>())
                    .add(new ExamScoreRow(userId, userName, userEmail,
                            roundTwo(initialScore), roundTwo(finalScore),
                            roundTwo(toneScore), roundTwo(sentenceScore), roundTwo(totalScore),
                            examId, examTitle));
        }

        List<ExamLeaderboard> result = new ArrayList<>();
        for (Map.Entry<Long, List<ExamScoreRow>> entry : perExam.entrySet()) {
            List<ExamScoreRow> sorted = entry.getValue().stream()
                    .sorted(Comparator.comparingDouble(ExamScoreRow::totalScore).reversed())
                    .collect(Collectors.toList());
            String title = examTitles.get(entry.getKey());
            result.add(new ExamLeaderboard(entry.getKey(), title, sorted));
        }

        result.sort(Comparator.comparing(ExamLeaderboard::examId));
        return result;
    }

    public List<LessonLeaderboard> getLessonLeaderboards() {
        List<Object[]> rows = iseLessonEntryRepository.aggregateLessonLeaderboard();
        Map<Long, UserEntity> users = userRepository.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));
        Map<Long, Lesson> lessons = lessonRepository.findAll().stream()
                .collect(Collectors.toMap(Lesson::getId, l -> l));

        Map<Long, List<UserScoreRow>> perLesson = new LinkedHashMap<>();
        for (Object[] r : rows) {
            if (r == null || r.length < 5) {
                continue;
            }
            Object lessonIdObj = r[0];
            Object userIdObj = r[1];
            if (lessonIdObj == null || userIdObj == null) {
                continue;
            }
            Long lessonId = ((Number) lessonIdObj).longValue();
            Long userId = ((Number) userIdObj).longValue();
            double avgScore = ((Number) r[2]).doubleValue();
            long attempts = ((Number) r[3]).longValue();
            double bestScore = ((Number) r[4]).doubleValue();

            UserEntity user = users.get(userId);
            String name = (user != null && user.getName() != null) ? user.getName() : String.valueOf(userId);
            String email = (user != null) ? user.getEmail() : null;

            perLesson.computeIfAbsent(lessonId, k -> new ArrayList<>())
                    .add(new UserScoreRow(userId, name, email, roundTwo(avgScore), attempts, roundTwo(bestScore)));
        }

        List<Lesson> orderedLessons = lessons.values().stream()
                .sorted(Comparator.comparing(Lesson::getOrder, Comparator.nullsLast(Integer::compare))
                        .thenComparing(Lesson::getId))
                .collect(Collectors.toList());

        List<LessonLeaderboard> result = new ArrayList<>();
        for (Lesson lesson : orderedLessons) {
            List<UserScoreRow> scores = perLesson.getOrDefault(lesson.getId(), Collections.emptyList()).stream()
                    .sorted(Comparator.comparingDouble(UserScoreRow::avgScore).reversed())
                    .collect(Collectors.toList());
            result.add(new LessonLeaderboard(lesson.getId(), lesson.getTitle(), scores));
        }
        return result;
    }

    private double roundTwo(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
