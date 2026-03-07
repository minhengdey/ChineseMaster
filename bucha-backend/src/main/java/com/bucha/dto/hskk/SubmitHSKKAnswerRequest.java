package com.bucha.dto.hskk;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitHSKKAnswerRequest {
    /** In-progress exam result id (from start-exam or session). */
    @NotNull
    private Long examResultId;
    @NotNull
    private Long questionId;
    /** Reference text for Part 1 (sentence to repeat); optional for Part 2/3. */
    private String referenceText;
}
