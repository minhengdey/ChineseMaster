package com.bucha.dto.hskk;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for HSKK Part 2 submit.
 * Controller receives questionText and audioFile via multipart form; this DTO holds question text for service layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Part2Request {
    /** Câu hỏi Part 2 (người học nghe và trả lời). */
    private String questionText;
}
