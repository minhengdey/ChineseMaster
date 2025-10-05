package com.bucha.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    @Value("${cloudinary.base-url:https://res.cloudinary.com}")
    private String baseUrl;

    // Resource types and folders (conventions)
    @Value("${cloudinary.json.resource-type:raw}")
    private String jsonResourceType;

    @Value("${cloudinary.audio.resource-type:video}")
    private String audioResourceType;

    @Value("${cloudinary.upload-type:upload}")
    private String uploadType;

    // Control whether to include version segment (e.g., v1) in delivery URLs
    @Value("${cloudinary.include-version:false}")
    private boolean includeVersion;

    @Bean
    public Cloudinary cloudinary() {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        return new Cloudinary(config);
    }

    /**
     * Build a Cloudinary delivery URL from a public_id using the configured
     * resource type (audioResourceType) and upload type.
     * Public ID should not include file extension.
     */
    public String buildUrlFromPublicId(String publicId) {
        // Use Cloudinary SDK to generate delivery URL; no extension appended
        var url = cloudinary()
                .url()
                .resourceType(audioResourceType)
                .type(uploadType);
        if (!includeVersion) {
            url = url.version(null);
        }
        return url.generate(publicId);
    }

}
