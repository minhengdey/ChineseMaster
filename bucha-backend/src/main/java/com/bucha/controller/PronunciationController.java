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

   /**
    * Lookup endpoint that accepts a single query parameter `q`.
    * The controller will try to resolve the query as an initial sound, then
    * as a final sound, and finally as a tone. Returns 404 if nothing found.
    * Example: GET /api/pronunciation?q=zh
    */
   @GetMapping
   public ResponseEntity<PronunciationGuideDto> lookup(@RequestParam("q") String q) {
      if (q == null || q.trim().isEmpty()) {
         return ResponseEntity.badRequest().build();
      }

      // try initial
      PronunciationGuideDto dto = pronunciationService.findByInitial(q);
      if (dto != null)
         return ResponseEntity.ok(dto);

      // try final
      dto = pronunciationService.findByFinal(q);
      if (dto != null)
         return ResponseEntity.ok(dto);

      // try tone
      dto = pronunciationService.findByTone(q);
      if (dto != null)
         return ResponseEntity.ok(dto);

      return ResponseEntity.notFound().build();
   }
}
