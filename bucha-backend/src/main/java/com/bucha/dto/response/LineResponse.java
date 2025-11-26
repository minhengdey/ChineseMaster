package com.bucha.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LineResponse {
    Long id;
    Long externalId;
    String contentHash;
    String zhText;
    String pinyin;
    String vnTranslation;
    String audioPublicId;
    String audioUrl;
}
