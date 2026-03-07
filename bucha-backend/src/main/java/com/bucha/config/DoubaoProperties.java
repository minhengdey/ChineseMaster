package com.bucha.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Typed configuration for Doubao AI chat API.
 * Values are sourced from application.yml {@code doubao.*} and resolved via environment variables.
 */
@Configuration
@ConfigurationProperties(prefix = "doubao")
public class DoubaoProperties {

    /** Full URL of the Doubao chat completions endpoint. */
    private String apiUrl = "https://api.doubao-ai.com/v1/chat/completions";

    /** Bearer token for Doubao API (DOUBAO_API_KEY env var). Empty = disabled. */
    private String apiKey = "";

    /** Model identifier (e.g. doubao-pro-32k, doubao-1.5-pro-32k). */
    private String model = "doubao-pro-32k";

    /** Maximum tokens in the model response (structured JSON + Vietnamese text; 400 was often truncated). */
    private int maxTokens = 1024;

    /** Sampling temperature (lower = more deterministic). */
    private double temperature = 0.5;

    /** HTTP call timeout in seconds. */
    private int timeoutSeconds = 15;

    // ── Getters & setters ──────────────────────────────────────────────

    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getMaxTokens() { return maxTokens; }
    public void setMaxTokens(int maxTokens) { this.maxTokens = maxTokens; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
}
