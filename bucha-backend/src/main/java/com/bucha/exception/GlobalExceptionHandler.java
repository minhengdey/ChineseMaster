package com.bucha.exception;

import com.bucha.client.IflytekApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Centralised HTTP error handling for all {@code /api/**} controllers.
 *
 * <p>Maps domain exceptions → HTTP status codes and a consistent
 * {@link ApiErrorResponse} JSON body. Internal stack traces are never
 * exposed in production responses.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 400 Bad Request ────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.debug("Bad request: {}", ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        String msg = "Required parameter '" + ex.getParameterName() + "' is missing.";
        return error(HttpStatus.BAD_REQUEST, msg);
    }

    // ── 413 Payload Too Large ──────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUploadTooLarge(MaxUploadSizeExceededException ex) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "Audio file exceeds the maximum allowed upload size.");
    }

    // ── 422 Unprocessable Entity ───────────────────────────────────────

    /**
     * Recording rejected, silence detected, or audio quality too low.
     * Returned as 422 so the frontend can show a "retry" prompt.
     */
    @ExceptionHandler(PronunciationEvaluationException.class)
    public ResponseEntity<ApiErrorResponse> handleEvaluationFailed(PronunciationEvaluationException ex) {
        logger.warn("[PronunciationEvaluation] {}", ex.getMessage());
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getUserMessage());
    }

    @ExceptionHandler(IflytekApiException.class)
    public ResponseEntity<ApiErrorResponse> handleIflytekError(IflytekApiException ex) {
        logger.warn("[IflytekClient] {}", ex.getMessage());
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    // ── 500 Internal Server Error ──────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex) {
        logger.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.");
    }

    // ─────────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────────

    private static ResponseEntity<ApiErrorResponse> error(HttpStatus status, String message) {
        ApiErrorResponse body = new ApiErrorResponse(
                status.value(),
                status.getReasonPhrase().toUpperCase().replace(' ', '_'),
                message);
        return ResponseEntity.status(status).body(body);
    }
}
