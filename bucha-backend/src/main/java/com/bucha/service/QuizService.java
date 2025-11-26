package com.bucha.service;

import com.bucha.dto.request.QuizSubmitRequest;
import com.bucha.dto.response.QuizCorrectionResponse;
import com.bucha.dto.response.QuizSubmitResponse;
import com.bucha.enums.ErrorCode;
import com.bucha.exception.AppException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuizService {
    public QuizSubmitResponse evaluate(QuizSubmitRequest request) {
        if (request.getAnswers() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        int score = 0;
        List<QuizCorrectionResponse> corrections = new ArrayList<>();
        for (var ans : request.getAnswers()) {
            String given = ans.getAnswer();
            boolean correct = "A".equalsIgnoreCase(given);
            if (correct)
                score++;
            corrections.add(QuizCorrectionResponse.builder()
                    .questionId(ans.getQuestionId())
                    .yourAnswer(given)
                    .correctAnswer("A")
                    .correct(correct)
                    .build());
        }
        return QuizSubmitResponse.builder()
                .score(score)
                .total(request.getAnswers().size())
                .corrections(corrections)
                .build();
    }
}
