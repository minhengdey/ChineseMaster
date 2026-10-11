package com.bucha.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Standardised JSON error body returned by {@link GlobalExceptionHandler}.
 *
 * <pre>
 * {
 *   "status":    422,
 *   "error":     "UNPROCESSABLE_ENTITY",
 *   "message":   "Recording quality too low. Please try again.",
 *   "timestamp": "2026-03-05T10:00:00Z"
 * }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private final int    status;
    private final String error;
    private final String message;
    private final String timestamp;

    public ApiErrorResponse(int status, String error, String message) {
        this.status    = status;
        this.error     = error;
        this.message   = message;
        this.timestamp = Instant.now().toString();
    }

    public int    getStatus()    { return status; }
    public String getError()     { return error; }
    public String getMessage()   { return message; }
    public String getTimestamp() { return timestamp; }
}
