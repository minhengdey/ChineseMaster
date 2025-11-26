package com.bucha.enums;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_EXISTED(1001, "User existed", HttpStatus.BAD_REQUEST),
    INVALID_KEY(1002, "Key invalid", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1003, "You do not have permission", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND(1004, "User not found", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1005, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    EMAIL_EXISTED(1006, "Email existed", HttpStatus.BAD_REQUEST),
    CURRENT_PASSWORD_REQUIRED(1007, "Current password required", HttpStatus.BAD_REQUEST),
    INCORRECT_CURRENT_PASSWORD(1008, "Current password incorrect", HttpStatus.FORBIDDEN),
    FLASHCARD_NOT_FOUND(1009, "Flashcard not found", HttpStatus.NOT_FOUND),
    LESSON_NOT_FOUND(1010, "Lesson not found", HttpStatus.NOT_FOUND),
    RESULT_REQUIRED(1011, "Result required", HttpStatus.BAD_REQUEST),
    FORBIDDEN(1012, "Forbidden", HttpStatus.FORBIDDEN),
    INVALID_INPUT(1013, "Invalid input", HttpStatus.BAD_REQUEST),
    PRONUNCIATION_NOT_FOUND(1014, "Pronunciation not found", HttpStatus.NOT_FOUND),
    CURRICULUM_NOT_FOUND(1015, "Curriculum not found", HttpStatus.NOT_FOUND),
    AUDIO_FILE_MISSING(1016, "Audio file missing or empty", HttpStatus.BAD_REQUEST),
    ISE_PROCESSING_FAILED(1017, "ISE processing failed", HttpStatus.INTERNAL_SERVER_ERROR),
    ;

    int code;
    String message;
    HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}