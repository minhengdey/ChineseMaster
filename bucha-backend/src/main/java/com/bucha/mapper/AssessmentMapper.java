package com.bucha.mapper;

import com.bucha.dto.assessment.*;
import com.bucha.entity.Exam;
import com.bucha.entity.Question;
import com.bucha.entity.UserExamResult;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AssessmentMapper {

    @Mapping(target = "id", expression = "java(exam.getExternalId() != null ? String.valueOf(exam.getExternalId()) : null)")
    @Mapping(target = "questionCount", expression = "java(exam.getQuestions() != null ? exam.getQuestions().size() : 0)")
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "score", ignore = true)
    ExamSummaryDTO toExamSummaryDTO(Exam exam);

    @Mapping(target = "id", expression = "java(exam.getExternalId() != null ? String.valueOf(exam.getExternalId()) : null)")
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "score", ignore = true)
    @Mapping(target = "testData", ignore = true)
    @Mapping(target = "lastResult", ignore = true)
    ExamDetailDTO toExamDetailDTO(Exam exam);

    @AfterMapping
    default void enrichQuestionDTO(@MappingTarget QuestionDTO dto, Question question) {
        // Enrich with vocabulary data if needed
        // This can be filled by service layer
    }
}
