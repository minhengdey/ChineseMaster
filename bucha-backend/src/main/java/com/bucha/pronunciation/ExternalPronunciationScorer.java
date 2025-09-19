package com.bucha.pronunciation;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Example adapter to a real external API (commented sample).
 *
 * TODO: Uncomment and implement using chosen provider SDK/HTTP client.
 *
 * Example (pseudo):
 *   1) open multipart input stream
 *   2) call external API endpoint (e.g. iFlytek / Google Speech-to-Text)
 *   3) parse transcription, align to expected phonemes and compute scores
 *   4) return PronunciationResult
 *
 * Security: store credentials in environment variables or secret manager.
 */
@Component
public class ExternalPronunciationScorer implements PronunciationScorer {
    @Override
    public PronunciationResult score(MultipartFile audio, Long lessonId) throws Exception {
        // Placeholder: for now delegate to mock
        return new PronunciationResult(0, new SyllableFeedback[0], "External scorer not implemented");
    }
}
