package com.bucha.client;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.bucha.config.IflytekProperties;
import com.bucha.pronunciation.IatMessageBuilder;
import com.bucha.pronunciation.IseGlobalUrlSigner;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.sound.sampled.*;
import java.io.*;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Calls iFlytek IAT (语音听写) WebSocket API for HSKK Part 2.
 * Connection flow (aligned with official WebAPI and Xunfei_Voice-style params):
 * 1. Build signed URL (HMAC-SHA256, same as ISE).
 * 2. Connect WebSocket, send first frame with app_id + business (language=zh_cn, accent=mandarin).
 * 3. Stream audio in 40ms chunks (1280 bytes @ 16kHz 16-bit), then end marker.
 * 4. Parse response: data.result.ws[].cw[].w (same structure as SDK ResultBean / getResultString()).
 * Uses same APP_ID / API_KEY / API_SECRET as ISE (from iflytek.* config).
 */
@Service
public class IflytekIatService {

    private static final Logger logger = LoggerFactory.getLogger(IflytekIatService.class);
    private static final int CHUNK_SIZE = IatConstants.FRAME_SIZE;
    private static final int LATCH_TIMEOUT_S = 60;

    private final IflytekProperties props;
    private final OkHttpClient okHttpClient = new OkHttpClient.Builder()
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();

    public IflytekIatService(IflytekProperties props) {
        this.props = props;
    }

    /**
     * Send audio to IAT WebSocket and return recognized text.
     *
     * @param audioFile user recording (webm / wav / mp3)
     * @return transcript text
     * @throws IflytekApiException if config missing, request fails, or no speech recognized
     */
    public String speechToText(MultipartFile audioFile) {
        String host = props.getIatHost();
        String path = props.getIatPath();
        if (host == null || host.isBlank() || path == null || path.isBlank()) {
            throw new IflytekApiException("IAT chưa được cấu hình (iat-host/iat-path).");
        }
        String apiKey = props.getApiKey();
        String apiSecret = props.getApiSecret();
        if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            throw new IflytekApiException("IAT cần API_KEY và API_SECRET (cùng ISE).");
        }
        if (audioFile == null || audioFile.isEmpty()) {
            throw new IllegalArgumentException("Audio file must not be empty.");
        }

        Path uploadedTemp = null;
        File wavFile = null;
        try {
            uploadedTemp = stageUploadedFile(audioFile);
            wavFile = ensureWavFile(uploadedTemp, audioFile.getOriginalFilename(), audioFile.getContentType());
            return runWebSocketIat(wavFile);
        } catch (IflytekApiException e) {
            throw e;
        } catch (UnsupportedAudioFileException e) {
            throw new IflytekApiException("Định dạng audio không hỗ trợ. Vui lòng dùng WAV, MP3 hoặc WebM.", e);
        } catch (Exception e) {
            logger.error("[IflytekIatService] speechToText failed", e);
            throw new IflytekApiException("Không nhận diện được giọng nói, vui lòng thử lại.", e);
        } finally {
            silentDelete(uploadedTemp);
            if (wavFile != null) silentDelete(wavFile.toPath());
        }
    }

    private String runWebSocketIat(File wavFile) throws Exception {
        String signedUrl = IseGlobalUrlSigner.generateSignedUrl(
                props.getIatHost(), props.getApiKey(), props.getApiSecret(), props.getIatPath());

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> errorRef = new AtomicReference<>();
        StringBuilder transcriptBuilder = new StringBuilder();

        WebSocketListener listener = new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                logger.debug("[IflytekIatService] WebSocket opened");
                try (FileInputStream fis = new FileInputStream(wavFile)) {
                    byte[] buf = new byte[CHUNK_SIZE];
                    int read = fis.read(buf);
                    if (read <= 0) {
                        webSocket.send(IatMessageBuilder.buildEndMarker().toJSONString());
                        errorRef.set("Không nhận diện được giọng nói, vui lòng thử lại.");
                        latch.countDown();
                        return;
                    }
                    byte[] firstChunk = read == CHUNK_SIZE ? buf : copyOf(buf, read);
                    webSocket.send(IatMessageBuilder.buildFirstFrame(props.getAppId(), firstChunk).toJSONString());
                    while ((read = fis.read(buf)) != -1) {
                        byte[] chunk = read == CHUNK_SIZE ? buf : copyOf(buf, read);
                        boolean last = (read < CHUNK_SIZE);
                        webSocket.send(IatMessageBuilder.buildAudioFrame(chunk, last).toJSONString());
                    }
                    webSocket.send(IatMessageBuilder.buildEndMarker().toJSONString());
                } catch (Exception e) {
                    logger.error("[IflytekIatService] Failed to stream audio", e);
                    errorRef.set("Stream error: " + e.getMessage());
                    latch.countDown();
                }
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                try {
                    JSONObject resp = JSONObject.parseObject(text);
                    int code = resp.getIntValue("code");
                    if (code != 0) {
                        String msg = resp.getString("message");
                        logger.warn("[IflytekIatService] IAT code={} message={}", code, msg);
                        errorRef.set(msg != null ? msg : "IAT error " + code);
                        latch.countDown();
                        return;
                    }
                    JSONObject data = resp.getJSONObject("data");
                    if (data == null) return;
                    int status = data.getIntValue("status");
                    JSONObject result = data.getJSONObject("result");
                    if (result != null) {
                        String part = extractTextFromResult(result);
                        if (part != null && !part.isEmpty()) {
                            transcriptBuilder.append(part);
                        }
                    }
                    if (status == 2) {
                        latch.countDown();
                    }
                } catch (Exception e) {
                    logger.debug("[IflytekIatService] onMessage parse error: {}", e.getMessage());
                }
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                logger.warn("[IflytekIatService] WebSocket failure: {}", t.getMessage());
                errorRef.set("WebSocket: " + t.getMessage());
                latch.countDown();
            }

            @Override
            public void onClosing(WebSocket webSocket, int code, String reason) {
                latch.countDown();
            }
        };

        Request request = new Request.Builder().url(signedUrl).build();
        WebSocket ws = okHttpClient.newWebSocket(request, listener);

        boolean timedOut = !latch.await(LATCH_TIMEOUT_S, TimeUnit.SECONDS);
        ws.close(1000, "done");

        if (timedOut) {
            throw new IflytekApiException("IAT hết thời gian chờ. Vui lòng thử lại.");
        }
        if (errorRef.get() != null) {
            throw new IflytekApiException("Không nhận diện được giọng nói, vui lòng thử lại.");
        }

        String transcript = transcriptBuilder.toString().trim();
        if (transcript.isEmpty()) {
            throw new IflytekApiException("Không nhận diện được giọng nói, vui lòng thử lại.");
        }
        return transcript;
    }

    /**
     * Extract text from data.result: ws[].cw[].w (same structure as SDK RecognizerResult / ResultBean).
     * Reference: Xunfei_Voice onResult → resultBean.getWs() → cw.get(j).getW().
     * Takes first candidate per word (cw[0].w).
     */
    private static String extractTextFromResult(JSONObject result) {
        JSONArray ws = result.getJSONArray("ws");
        if (ws == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ws.size(); i++) {
            JSONObject w = ws.getJSONObject(i);
            JSONArray cw = w.getJSONArray("cw");
            if (cw == null) continue;
            for (int j = 0; j < cw.size(); j++) {
                JSONObject c = cw.getJSONObject(j);
                String word = c.getString("w");
                if (word != null && !word.isEmpty()) {
                    sb.append(word);
                    break; // first candidate only
                }
            }
        }
        return sb.toString();
    }

    private static byte[] copyOf(byte[] src, int len) {
        byte[] out = new byte[len];
        System.arraycopy(src, 0, out, 0, len);
        return out;
    }

    private static Path stageUploadedFile(MultipartFile file) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        Path tmp = Files.createTempFile("iat-upload-", "." + ext);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
        }
        return tmp;
    }

    /**
     * Convert uploaded file to 16kHz 16-bit mono WAV for IAT.
     * WebM/Opus/MP3 from browser are converted via ffmpeg; WAV and Java Sound–supported formats use AudioSystem.
     */
    private static File ensureWavFile(Path source, String originalName, String contentType) throws Exception {
        File sourceFile = source.toFile();
        String lowerName = originalName == null ? "" : originalName.toLowerCase();
        String ct = contentType == null ? "" : contentType.toLowerCase();

        if (lowerName.endsWith(".wav") || ct.contains("wav")) {
            Path wavCopy = Files.createTempFile("iat-wav-", ".wav");
            Files.copy(source, wavCopy, StandardCopyOption.REPLACE_EXISTING);
            return wavCopy.toFile();
        }

        if (lowerName.endsWith(".webm") || ct.contains("webm") || lowerName.endsWith(".ogg") || ct.contains("ogg")
                || lowerName.endsWith(".opus") || ct.contains("opus") || lowerName.endsWith(".mp3") || ct.contains("mp3")) {
            try {
                return convertToWavWithFfmpeg(sourceFile);
            } catch (IOException | InterruptedException e) {
                logger.warn("[IflytekIatService] ffmpeg conversion failed: {}", e.getMessage());
                throw new IOException("Chuyển đổi audio sang WAV thất bại (cần ffmpeg cho WebM/MP3): " + e.getMessage(), e);
            }
        }

        Path wavTemp = Files.createTempFile("iat-wav-", ".wav");
        File wavFile = wavTemp.toFile();
        try {
            AudioInputStream rawAis = AudioSystem.getAudioInputStream(sourceFile);
            AudioFormat targetFmt = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED, 16000f, 16, 1, 2, 16000f, false);
            AudioInputStream convertedAis;
            try {
                convertedAis = AudioSystem.getAudioInputStream(targetFmt, rawAis);
            } catch (IllegalArgumentException ex) {
                AudioFormat intermediate = new AudioFormat(
                        AudioFormat.Encoding.PCM_SIGNED, rawAis.getFormat().getSampleRate(),
                        16, rawAis.getFormat().getChannels(),
                        rawAis.getFormat().getChannels() * 2, rawAis.getFormat().getSampleRate(), false);
                AudioInputStream step1 = AudioSystem.getAudioInputStream(intermediate, rawAis);
                convertedAis = AudioSystem.getAudioInputStream(targetFmt, step1);
            }
            AudioSystem.write(convertedAis, AudioFileFormat.Type.WAVE, wavFile);
            return wavFile;
        } catch (UnsupportedAudioFileException e) {
            silentDelete(wavTemp);
            throw e;
        } catch (Exception e) {
            silentDelete(wavTemp);
            throw new IOException("Chuyển đổi audio sang WAV thất bại: " + e.getMessage(), e);
        }
    }

    /** Convert WebM/MP3/Opus to 16kHz mono 16-bit WAV using ffmpeg (same as IseService). */
    private static File convertToWavWithFfmpeg(File inputFile) throws IOException, InterruptedException {
        String ffmpegPath = System.getenv().getOrDefault("FFMPEG_PATH", "ffmpeg");
        Path out = Files.createTempFile("iat-out-", ".wav");
        File outFile = out.toFile();
        ProcessBuilder pb = new ProcessBuilder(ffmpegPath, "-y", "-i", inputFile.getAbsolutePath(),
                "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", outFile.getAbsolutePath());
        pb.redirectErrorStream(true);
        Process p = pb.start();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                logger.debug("[IflytekIatService] ffmpeg: {}", line);
            }
        }
        boolean finished = p.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            throw new IOException("ffmpeg timeout (killed)");
        }
        int exit = p.exitValue();
        if (exit != 0) {
            throw new IOException("ffmpeg failed, exit code=" + exit);
        }
        if (!outFile.exists() || outFile.length() == 0) {
            throw new IOException("ffmpeg produced empty output");
        }
        return outFile;
    }

    private static String getExtension(String name) {
        if (name == null || !name.contains(".")) return "tmp";
        return name.substring(name.lastIndexOf('.') + 1);
    }

    private static void silentDelete(Path p) {
        try {
            if (p != null) Files.deleteIfExists(p);
        } catch (Exception ignored) {}
    }
}
