package com.bucha.controller;

import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private final Path uploadRoot = Paths.get("./uploads").toAbsolutePath();

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> streamAudio(@PathVariable String filename) {
        try {
            Path file = uploadRoot.resolve(filename).normalize();
            Resource res = new PathResource(file);
            if (!res.exists()) return ResponseEntity.notFound().build();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            return new ResponseEntity<>(res, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
