package com.bucha.service;

import com.bucha.entity.Flashcard;
import com.bucha.repository.FlashcardRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Implements a simple SM-2 variant for scheduling flashcards.
 */
@Service
public class FlashcardService {
    private final FlashcardRepository repo;

    public FlashcardService(FlashcardRepository repo) {
        this.repo = repo;
    }

    public List<Flashcard> getForUser(Long userId) {
        return repo.findByUserIdOrderByNextReviewAsc(userId);
    }

    public Flashcard review(Long cardId, String result) {
        var opt = repo.findById(cardId);
        if (opt.isEmpty()) throw new IllegalArgumentException("Card not found");
        Flashcard card = opt.get();
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
        if (ef < 1.3) ef = 1.3;
        card.setEfactor(ef);

        LocalDateTime next = LocalDateTime.now().plus(card.getIntervalDays(), ChronoUnit.DAYS);
        card.setNextReview(next);

        return repo.save(card);
    }
}
