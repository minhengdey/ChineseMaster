package com.bucha.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.util.Map;

@Slf4j
@RestController
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        try {
            boolean dbConnected = false;
            if (dataSource != null) {
                Connection conn = dataSource.getConnection();
                dbConnected = conn.isValid(2);
                conn.close();
            }

            return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "database", dbConnected ? "Connected" : "Not configured",
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.error("Health check failed", e);
            return ResponseEntity.status(500).body(Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/test-ffmpeg")
    public ResponseEntity<?> testFFmpeg() {
        try {
            ProcessBuilder pb = new ProcessBuilder("ffmpeg", "-version");
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();

            return ResponseEntity.ok(Map.of(
                    "status", "FFmpeg installed",
                    "exitCode", exitCode,
                    "version", output.toString().split("\n")[0]
            ));
        } catch (Exception e) {
            log.error("FFmpeg test failed", e);
            return ResponseEntity.status(500).body(Map.of(
                    "status", "FFmpeg not found",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/")
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of(
                "app", "Chinese Master Backend",
                "status", "Running",
                "version", "1.0.0"
        ));
    }
}