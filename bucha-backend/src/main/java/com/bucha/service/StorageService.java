package com.bucha.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Service
public class StorageService {
    private final Path root = Paths.get("./uploads").toAbsolutePath();

    public StorageService() throws IOException {
        Files.createDirectories(root);
    }

    public String store(MultipartFile file, String destFilename) throws IOException {
        Path dest = root.resolve(destFilename).normalize();
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        return destFilename;
    }

    public String store(MultipartFile file) throws IOException {
        String fn = System.currentTimeMillis() + "-" + file.getOriginalFilename();
        return store(file, fn);
    }
}
