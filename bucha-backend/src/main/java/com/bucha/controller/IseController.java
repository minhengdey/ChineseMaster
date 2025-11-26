package com.bucha.controller;

import com.bucha.security.JwtUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.bucha.service.IseService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.bucha.dto.response.IseScoreResponse;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/ise")
public class IseController {
    IseService iseService;

    @PostMapping(value = "/score", consumes = "multipart/form-data")
    public ResponseEntity<IseScoreResponse> score(@AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestPart("text") String text,
            @RequestPart("audio") MultipartFile audioFile,
            @RequestPart(value = "sub", required = false) String reqSub,
            @RequestPart(value = "ent", required = false) String reqEnt,
            @RequestPart(value = "lessonId", required = false) String lessonId,
            @RequestPart(value = "lineId", required = false) String lineId,
            @RequestPart(value = "vocabularyId", required = false) String vocabularyId,
            @RequestPart(value = "testId", required = false) String testId,
            @RequestPart(value = "includeInDaily", required = false) String includeInDaily,
            @RequestPart(value = "numSentences", required = false) String numSentences,
            @RequestPart(value = "scoreCategory", required = false) String scoreCategory,
            @RequestPart(value = "sessionDate", required = false) String sessionDate,
            @RequestPart(value = "durationSeconds", required = false) String durationSeconds,
            @RequestPart(value = "source", required = false) String source) throws Exception {
        IseScoreResponse resp = iseService.scoreDto(principal, text, audioFile, reqSub, reqEnt,
                scoreCategory,
                lessonId != null ? Long.parseLong(lessonId) : null,
                testId != null ? Long.parseLong(testId) : null,
                includeInDaily != null ? Boolean.parseBoolean(includeInDaily) : null,
                sessionDate,
                durationSeconds != null ? Double.parseDouble(durationSeconds) : null,
                numSentences != null ? Integer.parseInt(numSentences) : null,
                lineId,
                vocabularyId,
                source);
        return ResponseEntity.ok(resp);
    }
}