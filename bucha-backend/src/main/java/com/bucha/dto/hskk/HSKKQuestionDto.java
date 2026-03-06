package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HSKKQuestionDto {
    private Long id;
    private String text;
    private Integer part;
    private Integer questionOrder;
    private String audioUrl;
}
