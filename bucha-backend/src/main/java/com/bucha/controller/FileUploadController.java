// package com.bucha.controller;

// import com.bucha.service.CloudinaryService;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

// import java.util.Map;

// @RestController
// @RequestMapping("/api/files")
// public class FileUploadController {

// @Value("${cloudinary.upload-folder}")
// private String uploadFolder;

// private final CloudinaryService cloudinaryService;

// public FileUploadController(CloudinaryService cloudinaryService) {
// this.cloudinaryService = cloudinaryService;
// }

// @PostMapping("/upload")
// public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
// try {
// Map result = cloudinaryService.uploadFile(file, uploadFolder);
// // Trả về url và public_id cho client dùng
// return ResponseEntity.ok(Map.of(
// "public_id", result.get("public_id"),
// "secure_url", result.get("secure_url"),
// "raw", result
// ));
// } catch (IllegalArgumentException e) {
// return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
// } catch (Exception e) {
// return ResponseEntity.status(500).body(Map.of("error", "Upload thất bại",
// "detail", e.getMessage()));
// }
// }
// }
