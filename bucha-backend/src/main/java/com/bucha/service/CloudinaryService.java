package com.bucha.service;

import com.bucha.dto.CurriculumMetadataDto;
import com.bucha.dto.migration.ExamMigrationDTO;
import com.bucha.dto.migration.LessonMigrationDTO;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import io.swagger.v3.core.util.Json;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final RestTemplate restTemplate = new RestTemplate();

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String getAudioUrl(String publicId) {
        String pid = stripAnyExt(publicId);
        // Generate HTTPS URL and explicitly append mp3 extension for reliable playback
        return cloudinary.url()
                .secure(true)
                .resourceType("video")
                .type("upload")
                .format("mp3")
                .generate(pid);
    }

    private String ensureJsonExt(String id) {
        if (id == null)
            return null;
        return id.endsWith(".json") ? id : id + ".json";
    }

    private String stripJsonExt(String id) {
        if (id == null)
            return null;
        return id.endsWith(".json") ? id.substring(0, id.length() - 5) : id;
    }

    private String stripAnyExt(String id) {
        if (id == null)
            return null;
        int slash = id.lastIndexOf('/');
        int dot = id.lastIndexOf('.');
        if (dot > slash) {
            return id.substring(0, dot);
        }
        return id;
    }

    private Long getLatestVersionForRaw(String publicId) {
        try {

            @SuppressWarnings("rawtypes")
            Map res = cloudinary.api().resource(stripJsonExt(publicId),
                    ObjectUtils.asMap("resource_type", "raw", "type", "upload"));
            Object v = res.get("version");
            if (v instanceof Number) {
                return ((Number) v).longValue();
            }
        } catch (Exception e) {
            log.warn("Could not retrieve version for raw resource {}: {}", publicId, e.getMessage());
        }
        return null;
    }

    private String getRawFileUrlLatest(String publicId) {
        String withExt = ensureJsonExt(publicId);
        Long ver = getLatestVersionForRaw(withExt);
        if (ver != null) {
            return cloudinary.url().resourceType("raw").type("upload").version(ver.toString()).generate(withExt);
        }
        // Fallback: cache-busting query param
        String base = cloudinary.url().resourceType("raw").type("upload").generate(withExt);
        return base + (base.contains("?") ? "&" : "?") + "_cb=" + System.currentTimeMillis();
    }

    public CurriculumMetadataDto fetchCurriculumMetadataDto(String publicId) {
        try {
            String url = getRawFileUrlLatest(publicId);
            log.info("Fetching curriculum metadata (latest) from URL: {}", url);
            String json = restTemplate.getForObject(url, String.class);
            return Json.mapper().readValue(json, CurriculumMetadataDto.class);
        } catch (JsonMappingException e) {
            log.error("Failed to map JSON to CurriculumMetadataDto: {}", e.getMessage());
        } catch (JsonProcessingException e) {
            log.error("Failed to process JSON for CurriculumMetadataDto: {}", e.getMessage());
        }
        return null;

    }

    public LessonMigrationDTO fetchLessonMigrationDto(String publicId) {
        try {
            String url = getRawFileUrlLatest(publicId);
            log.info("Fetching lesson JSON (latest) from URL: {}", url);
            String json = restTemplate.getForObject(url, String.class);
            return Json.mapper().readValue(json, LessonMigrationDTO.class);
        } catch (Exception e) {
            log.error("Failed to fetch/parse LessonMigrationDTO for publicId={}", publicId, e);
            return null;
        }
    }

    public com.bucha.dto.migration.pronunciation.PronunciationDto fetchPronunciationDto(String publicId) {
        try {
            String url = getRawFileUrlLatest(publicId);
            log.info("Fetching pronunciation JSON (latest) from URL: {}", url);
            String json = restTemplate.getForObject(url, String.class);
            return Json.mapper().readValue(json, com.bucha.dto.migration.pronunciation.PronunciationDto.class);
        } catch (Exception e) {
            log.error("Failed to fetch/parse PronunciationDto for publicId={}", publicId, e);
            return null;
        }
    }

    public <T> T fetchJsonFile(String publicId, Class<T> inputClass) {
        try {
            String url = getRawFileUrlLatest(publicId);
            log.info("Fetching JSON (latest) from URL: {}", url);
            String json = restTemplate.getForObject(url, String.class);
            return Json.mapper().readValue(json, inputClass);
        } catch (Exception e) {
            log.error("Failed to fetch/parse {} for publicId={}", inputClass.getName(), publicId, e);
            return null;
        }
    }
}
