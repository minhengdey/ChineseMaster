package com.bucha.controller;

import com.bucha.entity.ChineseCharacter;
import com.bucha.service.ChineseAlphabetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chinese-alphabet")
public class ChineseAlphabetController {
    @Autowired
    private ChineseAlphabetService chineseAlphabetService;

    @GetMapping
    public List<ChineseCharacter> getAllCharacters() {
        return chineseAlphabetService.findAll();
    }

    @GetMapping("/audio/{id}")
    public ResponseEntity<Resource> getAudio(@PathVariable String id) {
        Resource audio = chineseAlphabetService.getAudioResource(id);
        ChineseCharacter character = chineseAlphabetService.findById(id);
        if (audio == null || character == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + character.getCharacter() + ".mp3")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(audio);
    }
}
