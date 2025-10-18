package com.bucha.dto.migration.pronunciation;

import lombok.Data;

import java.util.List;

@Data
public class PronunciationDto {
   private List<InitialSoundMigrationDto> initials;
   private List<FinalSoundMigrationDto> finals;
   private List<ToneMigrationDto> tones;
}
