package com.bucha.controller;

import com.bucha.entity.AudioAsset;
import com.bucha.entity.AudioType;
import com.bucha.repository.AudioAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/audio")
@RequiredArgsConstructor
public class AudioController {

    private final AudioAssetRepository audioAssetRepository;

    @GetMapping("/pinyin/{filename:.+}")
    public ResponseEntity<Resource> streamAudio(@PathVariable String filename) {
        try {
            System.out.println("Requesting audio: " + filename);

            // Tìm AudioAsset từ database
            AudioAsset audioAsset = audioAssetRepository.findByFilename(filename)
                    .orElse(null);

            if (audioAsset != null) {
                // Sử dụng AudioAsset từ database
                if (audioAsset.getAudioType() == AudioType.LOCAL_FILE) {
                    return streamLocalFile(audioAsset);
                } else {
                    return redirectToExternalUrl(audioAsset);
                }
            } else {
                // Fallback: tìm file trực tiếp trong uploads (backward compatibility)
                return streamDirectFile(filename);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private ResponseEntity<Resource> streamLocalFile(AudioAsset audioAsset) {
        Resource res = new FileSystemResource(Paths.get(audioAsset.getAudioPath()));
        if (!res.exists()) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(audioAsset.getMimeType()));
        return new ResponseEntity<>(res, headers, HttpStatus.OK);
    }

    private ResponseEntity<Resource> redirectToExternalUrl(AudioAsset audioAsset) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(audioAsset.getAudioPath()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    private ResponseEntity<Resource> streamDirectFile(String filename) {
        Resource res = new FileSystemResource(Paths.get("uploads", filename));
        if (!res.exists()) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        return new ResponseEntity<>(res, headers, HttpStatus.OK);
    }
}
