package com.bucha.controller;

import com.bucha.dto.pronunciation.PronunciationGuideDto;
import com.bucha.service.PronunciationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pronunciation")
@RequiredArgsConstructor
public class PronunciationController {

   private final PronunciationService pronunciationService;

   @GetMapping("/initial")
   public ResponseEntity<PronunciationGuideDto> getInitial(@RequestParam String initial) {
      PronunciationGuideDto dto = pronunciationService.findByInitial(initial);
      if (dto == null)
         return ResponseEntity.notFound().build();
      return ResponseEntity.ok(dto);
   }

   @GetMapping("/final")
   public ResponseEntity<PronunciationGuideDto> getFinal(@RequestParam String finalText) {
      PronunciationGuideDto dto = pronunciationService.findByFinal(finalText);
      if (dto == null)
         return ResponseEntity.notFound().build();
      return ResponseEntity.ok(dto);
   }

   @GetMapping("/tone")
   public ResponseEntity<PronunciationGuideDto> getTone(@RequestParam String name) {
      PronunciationGuideDto dto = pronunciationService.findByTone(name);
      if (dto == null)
         return ResponseEntity.notFound().build();
      return ResponseEntity.ok(dto);
   }
}
