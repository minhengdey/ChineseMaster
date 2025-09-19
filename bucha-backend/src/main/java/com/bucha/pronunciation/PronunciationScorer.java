package com.bucha.pronunciation;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface PronunciationScorer {
    PronunciationResult score(MultipartFile audio, Long lessonId) throws Exception;

    record SyllableFeedback(String text, String expected, boolean matched, double confidence) {}
    record PronunciationResult(int score, SyllableFeedback[] syllables, String feedback) {}
}
