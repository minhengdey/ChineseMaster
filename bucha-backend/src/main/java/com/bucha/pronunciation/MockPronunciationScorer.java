package com.bucha.pronunciation;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Deterministic mock scorer used for local testing.
 * Marked @Primary so it's chosen by default when multiple PronunciationScorer beans exist.
 *
 * TODO: Replace with real scorer integration (iFlytek / Google Speech-to-Text + custom scoring / AWS)
 */
@Component
@Primary
public class MockPronunciationScorer implements PronunciationScorer {

    @Override
    public PronunciationResult score(MultipartFile audio, Long lessonId) throws Exception {
        // Deterministic: use audio size to derive a mock score
        long size = audio.getSize();
        int score = (int) Math.min(95, 50 + (size % 50));
        PronunciationScorer.SyllableFeedback[] sylls = new PronunciationScorer.SyllableFeedback[] {
                new PronunciationScorer.SyllableFeedback("ni", "nǐ", true, 0.92),
                new PronunciationScorer.SyllableFeedback("hao", "hǎo", false, 0.45)
        };
        String fb = "Mock feedback. Replace with real scorer integration.";
        return new PronunciationResult(score, sylls, fb);
    }
}
