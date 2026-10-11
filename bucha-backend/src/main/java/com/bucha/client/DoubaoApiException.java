package com.bucha.client;

/**
 * Thrown when the Doubao AI API returns an unexpected error or is unreachable.
 * Callers should treat this as non-fatal: fall back to default feedback text.
 */
public class DoubaoApiException extends RuntimeException {

    public DoubaoApiException(String message) {
        super(message);
    }

    public DoubaoApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
