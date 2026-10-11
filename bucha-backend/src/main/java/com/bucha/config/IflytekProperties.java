package com.bucha.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Typed configuration for iFlytek ISE API.
 * Values are sourced from application.yml {@code iflytek.*} and resolved via environment variables.
 */
@Configuration
@ConfigurationProperties(prefix = "iflytek")
public class IflytekProperties {

    /** iFlytek App ID (APP_ID env var). */
    private String appId;

    /** iFlytek API Key (API_KEY env var). */
    private String apiKey;

    /** iFlytek API Secret (API_SECRET env var). */
    private String apiSecret;

    /** WebSocket host (default: ise-api-sg.xf-yun.com). */
    private String hostUrl = "ise-api-sg.xf-yun.com";

    /** Engine type: cn_vip for Mandarin. */
    private String ent = "cn_vip";

    /** Evaluation category: read_sentence or read_word. */
    private String category = "read_sentence";

    /** Sub-type identifier expected by ISE protocol. */
    private String sub = "ise";

    /** Audio format tag sent to ISE. */
    private String auf = "audio/L16;rate=16000";

    /** Audio encoding: raw PCM. */
    private String aue = "raw";

    /** WebSocket connection timeout in seconds. */
    private int connectTimeoutSeconds = 15;

    /** WebSocket read timeout in seconds. */
    private int readTimeoutSeconds = 300;

    /** WebSocket write timeout in seconds. */
    private int writeTimeoutSeconds = 120;

    /** IAT (Short Form ASR) WebSocket host for HSKK Part 2 (e.g. iat-api-sg.xf-yun.com). */
    private String iatHost = "iat-api-sg.xf-yun.com";
    /** IAT WebSocket path (e.g. /v2/iat). */
    private String iatPath = "/v2/iat";

    // ── Getters & setters ──────────────────────────────────────────────

    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getApiSecret() { return apiSecret; }
    public void setApiSecret(String apiSecret) { this.apiSecret = apiSecret; }

    public String getHostUrl() { return hostUrl; }
    public void setHostUrl(String hostUrl) { this.hostUrl = hostUrl; }

    public String getEnt() { return ent; }
    public void setEnt(String ent) { this.ent = ent; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSub() { return sub; }
    public void setSub(String sub) { this.sub = sub; }

    public String getAuf() { return auf; }
    public void setAuf(String auf) { this.auf = auf; }

    public String getAue() { return aue; }
    public void setAue(String aue) { this.aue = aue; }

    public int getConnectTimeoutSeconds() { return connectTimeoutSeconds; }
    public void setConnectTimeoutSeconds(int connectTimeoutSeconds) { this.connectTimeoutSeconds = connectTimeoutSeconds; }

    public int getReadTimeoutSeconds() { return readTimeoutSeconds; }
    public void setReadTimeoutSeconds(int readTimeoutSeconds) { this.readTimeoutSeconds = readTimeoutSeconds; }

    public int getWriteTimeoutSeconds() { return writeTimeoutSeconds; }
    public void setWriteTimeoutSeconds(int writeTimeoutSeconds) { this.writeTimeoutSeconds = writeTimeoutSeconds; }

    public String getIatHost() { return iatHost; }
    public void setIatHost(String iatHost) { this.iatHost = iatHost; }
    public String getIatPath() { return iatPath; }
    public void setIatPath(String iatPath) { this.iatPath = iatPath; }
}
