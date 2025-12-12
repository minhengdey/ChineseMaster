package com.bucha.mapper;

import com.bucha.dto.assessment.QuestionDTO;
import com.bucha.entity.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface QuestionMapper {
    Question toEntity(QuestionDTO questionDTO);

    @Mapping(target = "externalId", source = "externalId")
    QuestionDTO toDto(Question question);
}
