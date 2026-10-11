package com.bucha.exception;

public class ExamNotFoundException extends RuntimeException {
    public ExamNotFoundException(String message) {
        super(message);
    }

    public ExamNotFoundException(Long examId) {
        super("Exam not found with id: " + examId);
    }
}
