package com.bucha.dto.migration.pronunciation;

import lombok.Data;

import java.util.List;

@Data
public class PronunciationDto {
   private List<InitialSoundDto> initials;
   private List<FinalSoundDto> finals;
   private List<ToneDto> tones;
}
