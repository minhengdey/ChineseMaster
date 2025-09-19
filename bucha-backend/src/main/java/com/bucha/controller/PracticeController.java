package com.bucha.controller;

import com.bucha.dto.PronunciationScoreDto;
import com.bucha.pronunciation.PronunciationScorer;
import com.bucha.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final StorageService storageService;
    private final PronunciationScorer scorer;

    public PracticeController(StorageService storageService, PronunciationScorer scorer) {
        this.storageService = storageService;
        this.scorer = scorer;
    }

    /**
     * Upload recorded audio and get a pronunciation score.
     * multipart/form-data: file=audio, lessonId=...
     */
    @PostMapping("/score")
    public ResponseEntity<PronunciationScoreDto> score(@RequestPart("file") MultipartFile file,
            @RequestPart(required = false) Long lessonId) throws Exception {
        String filename = storageService.store(file);
        var res = scorer.score(file, lessonId);
        PronunciationScoreDto dto = new PronunciationScoreDto();
        dto.score = res.score();
        dto.feedback = res.feedback();
        dto.audioUrl = "/api/audio/" + filename;
        dto.syllables = new java.util.ArrayList<>();
        if (res.syllables() != null) {
            for (var s : res.syllables()) {
                PronunciationScoreDto.SyllableScore ss = new PronunciationScoreDto.SyllableScore();
                ss.text = s.text();
                ss.expected = s.expected();
                ss.matched = s.matched();
                ss.confidence = s.confidence();
                dto.syllables.add(ss);
            }
        }
        return ResponseEntity.ok(dto);
    }
}
