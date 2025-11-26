package com.bucha.mapper;

import com.bucha.entity.Flashcard;
import com.bucha.dto.response.FlashcardResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FlashcardMapper {
    FlashcardResponse toResponse(Flashcard flashcard);
}
