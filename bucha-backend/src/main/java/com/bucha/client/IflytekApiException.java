package com.bucha.client;

/**
 * Thrown when iFlytek ISE API returns an error, times out, or rejects the recording.
 */
public class IflytekApiException extends RuntimeException {

    public IflytekApiException(String message) {
        super(message);
    }

    public IflytekApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
