package com.bucha.controller;

import com.bucha.entity.Flashcard;
import com.bucha.pronunciation.PronunciationScorer;
import com.bucha.repository.FlashcardRepository;
import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.FlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Flashcard endpoints:
 *  - GET  /api/flashcards               -> list user's flashcards (ordered by nextReview)
 *  - POST /api/flashcards               -> create a flashcard for the authenticated user
 *  - GET  /api/flashcards/{id}          -> get single flashcard (must belong to user)
 *  - POST /api/flashcards/{id}/review  { result: "again"|"good"|"easy" } -> update SRS scheduling
 *
 * Notes:
 *  - We enforce ownership by checking flashcard.userId against JWT principal id.
 *  - The service uses a simple SM-2 variant and persists efactor/intervalDays/nextReview.
 */
@RestController
@RequestMapping("/api/flashcards")
public class FlashcardController {

    private final FlashcardService service;
    private final FlashcardRepository repository;

    public FlashcardController(FlashcardService service, FlashcardRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Flashcard>> listForUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Long uid = principal.id();
        List<Flashcard> cards = service.getForUser(uid);
        return ResponseEntity.ok(cards);
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal JwtUserPrincipal principal,
                                    @RequestBody Flashcard payload) {
        Long uid = principal.id();
        if (payload.getHanzi() == null || payload.getHanzi().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "hanzi is required"));
        }
        Flashcard card = new Flashcard();
        card.setUserId(uid);
        card.setHanzi(payload.getHanzi());
        card.setPinyin(payload.getPinyin());
        card.setMeaning(payload.getMeaning());
        // default SM-2 fields are already set by entity (efactor=2.5, intervalDays=0, box=1)
        Flashcard saved = repository.save(card);
        return ResponseEntity.created(URI.create("/api/flashcards/" + saved.getId())).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@AuthenticationPrincipal JwtUserPrincipal principal,
                                    @PathVariable Long id) {
        Optional<Flashcard> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Flashcard card = opt.get();
        if (!card.getUserId().equals(principal.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }
        return ResponseEntity.ok(card);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> review(@AuthenticationPrincipal JwtUserPrincipal principal,
                                    @PathVariable Long id,
                                    @RequestBody Map<String, String> body) {
        String result = body.get("result");
        if (result == null) return ResponseEntity.badRequest().body(Map.of("error", "result required"));

        Optional<Flashcard> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Flashcard card = opt.get();
        if (!card.getUserId().equals(principal.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            Flashcard updated = service.review(id, result);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "internal error"));
        }
    }

    // Optional: admin/test endpoint to delete a flashcard (keeps controller convenient during development)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal JwtUserPrincipal principal,
                                    @PathVariable Long id) {
        Optional<Flashcard> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Flashcard card = opt.get();
        if (!card.getUserId().equals(principal.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
