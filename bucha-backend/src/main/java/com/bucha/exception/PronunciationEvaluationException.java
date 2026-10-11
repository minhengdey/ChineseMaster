package com.bucha.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown by {@code PronunciationService} when the evaluation pipeline fails in a
 * way that should be surfaced to the client with an HTTP 422 status.
 *
 * <p>Examples: recording too short, all silence, iFlytek rejected the audio.</p>
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class PronunciationEvaluationException extends RuntimeException {

    private final String userMessage;

    public PronunciationEvaluationException(String userMessage) {
        super(userMessage);
        this.userMessage = userMessage;
    }

    public PronunciationEvaluationException(String userMessage, Throwable cause) {
        super(userMessage, cause);
        this.userMessage = userMessage;
    }

    public String getUserMessage() { return userMessage; }
}
