package com.bucha.dto.migration;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)

public class ExamMigrationDTO {
    String title;
    List<QuestionMigrationDTO> questions;
}
