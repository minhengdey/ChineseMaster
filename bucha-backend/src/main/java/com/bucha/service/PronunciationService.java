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
      Optional<InitialSound> maybe = initialSoundRepository.findFirstByText(initial);
      if (maybe.isEmpty())
         return null;
      InitialSound s = maybe.get();
      PronunciationGuideDto dto = new PronunciationGuideDto();
      dto.setType("initial");
      dto.setKey(s.getText());
      dto.setIpa(s.getIpa());
      dto.setPronunciation(s.getPronunciation());
      return dto;
   }

   public PronunciationGuideDto findByFinal(String finalText) {
      Optional<FinalSound> maybe = finalSoundRepository.findFirstByText(finalText);
      if (maybe.isEmpty())
         return null;
      FinalSound s = maybe.get();
      PronunciationGuideDto dto = new PronunciationGuideDto();
      dto.setType("final");
      dto.setKey(s.getText());
      dto.setIpa(s.getIpa());
      dto.setPronunciation(s.getPronunciation());
      return dto;
   }

   public PronunciationGuideDto findByTone(String toneName) {
      // try matching by name first (backwards compat)
      Optional<Tone> maybe = toneRepository.findByName(toneName);

      // Normalize common frontend formats: "TONE2" or "2" or multi-digit marks like
      // "214"
      String normalizedToneMark = null;
      if (maybe.isEmpty() && toneName != null) {
         String upper = toneName.trim().toUpperCase();
         // TONE2 -> 2
         java.util.regex.Matcher m = java.util.regex.Pattern
               .compile("TONE(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(upper);
         if (m.find()) {
            normalizedToneMark = m.group(1);
         } else {
            // any digits in the string
            java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("(\\d+)").matcher(toneName);
            if (m2.find())
               normalizedToneMark = m2.group(1);
         }
      }

      // try tone_mark using normalized value first, then raw input as fallback
      if (maybe.isEmpty()) {
         // If normalizedToneMark looks like a number, try matching by sortOrder first
         if (normalizedToneMark != null) {
            try {
               Integer idx = Integer.valueOf(normalizedToneMark);
               maybe = toneRepository.findByOrder(idx);
            } catch (NumberFormatException ignored) {
            }
            // if not found by sortOrder, fall back to toneMark match
            if (maybe.isEmpty()) {
               maybe = toneRepository.findByToneMark(normalizedToneMark);
            }
         }
         if (maybe.isEmpty()) {
            // try raw input as toneMark
            maybe = toneRepository.findByToneMark(toneName);
         }
      }
      if (maybe.isEmpty())
         return null;
      Tone s = maybe.get();
      PronunciationGuideDto dto = new PronunciationGuideDto();
      dto.setType("tone");
      // prefer returning tone_mark when available as the key, otherwise fall back to
      // sortOrder or name
      if (s.getToneMark() != null) {
         dto.setKey(s.getToneMark());
      } else if (s.getOrder() != null) {
         dto.setKey(String.valueOf(s.getOrder()));
      } else {
         dto.setKey(s.getName());
      }
      dto.setIpa(s.getPitchValue());
      dto.setPronunciation(s.getPronunciation());
      return dto;
   }
}
