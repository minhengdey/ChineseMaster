package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for HSKK Part 3 submit.
 * Controller receives questionText and audioFile via multipart form; this DTO holds question text for service layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Part3Request {
    /** Câu hỏi Part 3 (nói tự do, tối đa 1.5 phút). */
    private String questionText;
}
