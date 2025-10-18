package com.bucha.service;

import com.bucha.dto.pronunciation.PronunciationGuideDto;
import com.bucha.entity.InitialSound;
import com.bucha.entity.FinalSound;
import com.bucha.entity.Tone;
import com.bucha.repository.InitialSoundRepository;
import com.bucha.repository.FinalSoundRepository;
import com.bucha.repository.ToneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PronunciationService {
   private final InitialSoundRepository initialSoundRepository;
   private final FinalSoundRepository finalSoundRepository;
   private final ToneRepository toneRepository;

   public PronunciationGuideDto findByInitial(String initial) {
      Optional<InitialSound> maybe = initialSoundRepository.findByInitial(initial);
      if (maybe.isEmpty())
         return null;
      InitialSound s = maybe.get();
      PronunciationGuideDto dto = new PronunciationGuideDto();
      dto.setType("initial");
      dto.setKey(s.getInitial());
      dto.setIpa(s.getIpa());
      dto.setPronunciation(s.getPronunciation());
      return dto;
   }

   public PronunciationGuideDto findByFinal(String finalText) {
      Optional<FinalSound> maybe = finalSoundRepository.findByFinalText(finalText);
      if (maybe.isEmpty())
         return null;
      FinalSound s = maybe.get();
      PronunciationGuideDto dto = new PronunciationGuideDto();
      dto.setType("final");
      dto.setKey(s.getFinalText());
      dto.setIpa(s.getIpa());
      dto.setPronunciation(s.getPronunciation());
      return dto;
   }

   public PronunciationGuideDto findByTone(String toneName) {
      Optional<Tone> maybe = toneRepository.findByName(toneName);
      if (maybe.isEmpty())
         return null;
      Tone s = maybe.get();
      PronunciationGuideDto dto = new PronunciationGuideDto();
      dto.setType("tone");
      dto.setKey(s.getName());
      dto.setIpa(s.getPitchValue());
      dto.setPronunciation(s.getPronunciation());
      return dto;
   }
}
