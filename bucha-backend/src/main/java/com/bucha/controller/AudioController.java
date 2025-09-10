package com.bucha.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    @GetMapping("/pinyin/{filename:.+}")
    public ResponseEntity<Resource> streamAudio(@PathVariable String filename) {
        try {
            System.out.println(filename);
            Resource res = new ClassPathResource("uploads/pinyin/" + filename);
            if (!res.exists())
                return ResponseEntity.notFound().build();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            return new ResponseEntity<>(res, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
 