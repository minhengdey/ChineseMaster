package com.bucha.service;

import com.bucha.entity.Flashcard;
import com.bucha.repository.FlashcardRepository;
import com.bucha.mapper.FlashcardMapper;
import com.bucha.enums.ErrorCode;
import com.bucha.exception.AppException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import com.bucha.dto.request.FlashcardCreateRequest;
import com.bucha.dto.response.FlashcardResponse;

/**
 * Implements a simple SM-2 variant for scheduling flashcards.
 */
@Service
public class FlashcardService {
    private final FlashcardRepository repo;
    private final FlashcardMapper mapper;

    public FlashcardService(FlashcardRepository repo, FlashcardMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<FlashcardResponse> getForUser(Long userId) {
        return repo.findByUserIdOrderByNextReviewAsc(userId).stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public FlashcardResponse create(Long userId, FlashcardCreateRequest payload) {
        if (payload.getHanzi() == null || payload.getHanzi().isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        Flashcard card = new Flashcard();
        card.setUserId(userId);
        card.setHanzi(payload.getHanzi());
        card.setPinyin(payload.getPinyin());
        card.setMeaning(payload.getMeaning());
        Flashcard saved = repo.save(card);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public FlashcardResponse getOne(Long userId, Long id) {
        Flashcard card = repo.findById(id).orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return mapper.toResponse(card);
    }

    @Transactional
    public FlashcardResponse review(Long userId, Long cardId, String result) {
        Flashcard card = repo.findById(cardId).orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        // Map result to quality score
        int quality = switch (result) {
            case "easy" -> 5;
            case "good" -> 4;
            default -> 2; // again/hard
        };

        // SM-2 simplified:
        if (quality < 3) {
            card.setIntervalDays(0);
            card.setBox(1);
        } else {
            int oldInterval = card.getIntervalDays();
            int newInterval = switch (oldInterval) {
                case 0 -> 1;
                case 1 -> 6;
                default -> Math.max(1, (int) Math.round(oldInterval * card.getEfactor()));
            };
            card.setIntervalDays(newInterval);
            card.setBox(card.getBox() + 1);
        }

        // update efactor
        double ef = card.getEfactor() + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (ef < 1.3)
            ef = 1.3;
        card.setEfactor(ef);

        LocalDateTime next = LocalDateTime.now().plus(card.getIntervalDays(), ChronoUnit.DAYS);
        card.setNextReview(next);

        Flashcard saved = repo.save(card);
        return mapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Flashcard card = repo.findById(id).orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        repo.deleteById(id);
    }

    // Mapping moved to FlashcardMapper (MapStruct)
}
