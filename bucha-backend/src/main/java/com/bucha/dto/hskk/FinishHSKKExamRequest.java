package com.bucha.dto.hskk;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinishHSKKExamRequest {
    @NotNull
    private Long examResultId;
}
