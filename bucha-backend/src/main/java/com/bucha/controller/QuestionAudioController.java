package com.bucha.controller;

import com.bucha.entity.Question;
import com.bucha.repository.QuestionRepository;
import com.bucha.service.CloudinaryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/questions")
public class QuestionAudioController {

    private final QuestionRepository questionRepository;
    private final CloudinaryService cloudinaryService;

    public QuestionAudioController(QuestionRepository questionRepository, CloudinaryService cloudinaryService) {
        this.questionRepository = questionRepository;
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Serve audio for a question.
     * Accepts either Cloudinary publicId or itemId (question id).
     * Redirects (302) to Cloudinary URL for efficient streaming by the client.
     */
    @GetMapping("/audio")
    public ResponseEntity<Void> getQuestionAudio(
            @RequestParam(value = "publicId", required = false) String publicId,
            @RequestParam(value = "itemId", required = false) Long itemId) {
        String pid = publicId;
        if (pid == null || pid.isBlank()) {
            if (itemId == null) {
                return ResponseEntity.badRequest().build();
            }
            Question q = questionRepository.findById(itemId).orElse(null);
            if (q == null || q.getAudioPublicId() == null || q.getAudioPublicId().isBlank()) {
                return ResponseEntity.notFound().build();
            }
            pid = q.getAudioPublicId();
        }

        String audioUrl = cloudinaryService.getAudioUrl(pid);
        if (audioUrl == null || audioUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, audioUrl)
                .build();
    }
}
