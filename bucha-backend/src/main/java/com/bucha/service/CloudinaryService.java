package com.bucha.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Upload file to Cloudinary and return the full upload result map.
     */
    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File trống");
        }

        // params: folder, resource_type auto để upload cả ảnh/video/file
        Map params = ObjectUtils.asMap(
                "folder", folder != null ? folder : "",
                "resource_type", "auto"
        );

        // upload: trả về Map chứa keys như "public_id", "secure_url", "url", ...
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        return uploadResult;
    }
}

