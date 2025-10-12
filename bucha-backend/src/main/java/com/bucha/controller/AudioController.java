// package com.bucha.controller;

// import com.bucha.entity.AudioAsset;
// import com.bucha.entity.AudioType;
// import com.bucha.repository.AudioAssetRepository;
// import lombok.RequiredArgsConstructor;
// import org.springframework.core.io.Resource;
// import org.springframework.http.*;
// import org.springframework.web.bind.annotation.*;

// import java.net.URI;

// @RestController
// @RequestMapping("/api/audio")
// @RequiredArgsConstructor
// public class AudioController {

// private final AudioAssetRepository audioAssetRepository;

// @GetMapping("/pinyin/{filename:.+}")
// public ResponseEntity<Resource> streamAudio(@PathVariable String filename) {
// try {
// System.out.println("Requesting audio: " + filename);

// // Tìm AudioAsset từ database
// AudioAsset audioAsset = audioAssetRepository.findByFilename(filename)
// .orElse(null);

// if (audioAsset != null) {
// // Cloudinary-only/External: redirect to URL
// if (audioAsset.getAudioType() == AudioType.CLOUDINARY_URL
// || audioAsset.getAudioType() == AudioType.CLOUDINARY_AUTO
// || audioAsset.getAudioType() == AudioType.EXTERNAL_URL) {
// return redirectToExternalUrl(audioAsset);
// }
// // Unsupported/local types in Cloudinary-only mode
// return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
// } else {
// return ResponseEntity.notFound().build();
// }

// } catch (Exception e) {
// return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
// }
// }

// private ResponseEntity<Resource> redirectToExternalUrl(AudioAsset audioAsset)
// {
// HttpHeaders headers = new HttpHeaders();
// headers.setLocation(URI.create(audioAsset.getAudioPath()));
// return new ResponseEntity<>(headers, HttpStatus.FOUND);
// }
// }
