package com.bucha.controller;

import com.bucha.security.JwtUserPrincipal;
import com.bucha.service.FlashcardService;
import com.bucha.dto.request.FlashcardCreateRequest;
import com.bucha.dto.response.FlashcardResponse;
import com.bucha.enums.ErrorCode;
import com.bucha.exception.AppException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import com.bucha.dto.request.FlashcardReviewRequest;

/**
 * Flashcard endpoints:
 * - GET /api/flashcards -> list user's flashcards (ordered by nextReview)
 * - POST /api/flashcards -> create a flashcard for the authenticated user
 * - GET /api/flashcards/{id} -> get single flashcard (must belong to user)
 * - POST /api/flashcards/{id}/review { result: "again"|"good"|"easy" } ->
 * update SRS scheduling
 *
 * Notes:
 * - We enforce ownership by checking flashcard.userId against JWT principal id.
 * - The service uses a simple SM-2 variant and persists
 * efactor/intervalDays/nextReview.
 */
@RestController
@RequestMapping("/api/flashcards")
public class FlashcardController {

    private final FlashcardService service;

    public FlashcardController(FlashcardService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<FlashcardResponse>> listForUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Long uid = principal.id();
        return ResponseEntity.ok(service.getForUser(uid));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestBody FlashcardCreateRequest payload) {
        Long uid = principal.id();
        FlashcardResponse saved = service.create(uid, payload);
        return ResponseEntity.created(URI.create("/api/flashcards/" + saved.getId())).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getOne(principal.id(), id));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> review(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id,
            @RequestBody FlashcardReviewRequest body) {
        String result = body.getResult();
        if (result == null)
            throw new AppException(ErrorCode.RESULT_REQUIRED);

        FlashcardResponse updated = service.review(principal.id(), id, result);
        return ResponseEntity.ok(updated);
    }

    // Optional: admin/test endpoint to delete a flashcard (keeps controller
    // convenient during development)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id) {
        service.delete(principal.id(), id);
        return ResponseEntity.noContent().build();
    }
}
