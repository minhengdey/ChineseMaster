package com.bucha.pronunciation;

import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sound.sampled.*;
import java.io.*;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

public class IseFileStreamer {
    private static final Logger logger = LoggerFactory.getLogger(IseFileStreamer.class);

    private static final int CHUNK_SIZE = 1280; // 40ms @16kHz 16-bit mono
    private static final int FRAME_INTERVAL = 40; // ms pacing (optional)

    /**
     * streamCancelled: caller controls this flag; when true streamer must stop ASAP.
     *
     * sendJsonConsumer: accepts String JSON to send via websocket.
     */
    public static void streamFile(File audioFile,
                                  Consumer<String> sendJsonConsumer,
                                  String appId,
                                  String text,
                                  AtomicBoolean streamCancelled) {
        logger.info("Starting to stream file: {} (size: {} bytes)", audioFile.getName(), audioFile.length());

        try (AudioInputStream audioInputStream = AudioSystem.getAudioInputStream(audioFile)) {
            AudioFormat sourceFormat = audioInputStream.getFormat();
            logger.info("Source audio format: {}", sourceFormat);

            AudioFormat targetFormat = new AudioFormat(
                    AudioFormat.Encoding.PCM_SIGNED,
                    16000f,
                    16,
                    1,
                    2,
                    16000f,
                    false
            );

            AudioInputStream convertedStream = audioInputStream;
            if (!AudioFormatsEqual(sourceFormat, targetFormat)) {
                try {
                    logger.info("Converting audio format from {} to {}", sourceFormat, targetFormat);
                    convertedStream = AudioSystem.getAudioInputStream(targetFormat, audioInputStream);
                } catch (Exception ex) {
                    logger.warn("Conversion failed, will use original stream: {}", ex.getMessage());
                    convertedStream = audioInputStream;
                }
            }

            // debug header
            try (InputStream fis = new BufferedInputStream(new FileInputStream(audioFile))) {
                fis.mark(64);
                byte[] header = new byte[16];
                int r = fis.read(header);
                fis.reset();
                if (r > 0) {
                    logger.info("File header bytes (first {}): {}", r, java.util.Arrays.toString(java.util.Arrays.copyOf(header, r)));
                }
            } catch (Exception ignore) {}

            long totalBytesRead = 0;
            long totalFramesSent = 0;
            byte[] buffer = new byte[CHUNK_SIZE];
            int bytesRead;
            int frameSeq = 0;
            boolean sentEndMarker = false;

            // IMPORTANT: Controller should already have sent the parameter-upload frame (cmd="ssb", data.status=0).
            // Here we only send audio upload frames with business.cmd="auw" and business.aus set accordingly.

            while (!streamCancelled.get() && (bytesRead = convertedStream.read(buffer)) != -1) {
                totalBytesRead += bytesRead;

                byte[] frameData;
                if (bytesRead == CHUNK_SIZE) {
                    frameData = buffer.clone();
                } else {
                    frameData = new byte[bytesRead];
                    System.arraycopy(buffer, 0, frameData, 0, bytesRead);
                }

                String base64Audio = Base64.getEncoder().encodeToString(frameData);
                boolean isLastChunk = (bytesRead < CHUNK_SIZE);

                JSONObject frame = new JSONObject();

                // business: for audio upload use cmd="auw" and aus: 1 first, 2 middle, 4 last
                JSONObject business = new JSONObject();
                business.put("cmd", "auw");
                int aus = (frameSeq == 0) ? 1 : 2;
                if (isLastChunk) aus = 4;
                business.put("aus", aus);
                frame.put("business", business);

                // data: follow iFLYTEK spec: key name for base64 is "data"
                JSONObject data = new JSONObject();
                data.put("status", isLastChunk ? 2 : 1); // 1: continue, 2: final. (param-upload used status=0)
                data.put("data", base64Audio);
                frame.put("data", data);

                // preview log for the first frame (avoid logging full base64)
                if (frameSeq == 0) {
                    String preview = frame.toJSONString();
                    logger.info("First audio-frame preview ({} chars): {}",
                            Math.min(600, preview.length()), preview.substring(0, Math.min(600, preview.length())));
                }

                if (streamCancelled.get()) break;

                try {
                    sendJsonConsumer.accept(frame.toJSONString());
                } catch (Throwable sendEx) {
                    logger.warn("Failed to send audio frame seq={} due to: {}", frameSeq, sendEx.getMessage());
                    streamCancelled.set(true);
                    break;
                }

                frameSeq++;
                totalFramesSent++;

                if (frameSeq % 10 == 0) {
                    logger.info("Sent {} frames, {} bytes processed", frameSeq, totalBytesRead);
                }

                if (isLastChunk) {
                    sentEndMarker = true;
                    break;
                }

                try {
                    Thread.sleep(FRAME_INTERVAL);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            // If file size is exact multiple of CHUNK_SIZE, we must still send explicit final frame
            if (!streamCancelled.get() && !sentEndMarker) {
                logger.info("Sending explicit final end-marker frame.");
                JSONObject endFrame = new JSONObject();
                JSONObject business = new JSONObject();
                business.put("cmd", "auw");
                business.put("aus", 4); // last
                endFrame.put("business", business);

                JSONObject data = new JSONObject();
                data.put("status", 2);
                data.put("data", ""); // empty final
                endFrame.put("data", data);
                try {
                    sendJsonConsumer.accept(endFrame.toJSONString());
                } catch (Throwable ex) {
                    logger.warn("Failed to send final end marker: {}", ex.getMessage());
                }
            } else if (streamCancelled.get()) {
                logger.info("Streaming aborted due to cancellation flag.");
            }

            double estimatedSeconds = (double) totalBytesRead / (16000.0 * 2.0);
            logger.info("Streaming finished. Total frames sent: {}, Total bytes processed: {}, estimated seconds: {}",
                    totalFramesSent, totalBytesRead, estimatedSeconds);

        } catch (UnsupportedAudioFileException uafe) {
            logger.error("Unsupported audio file: {}", uafe.getMessage(), uafe);
            throw new RuntimeException("Unsupported audio file", uafe);
        } catch (Exception e) {
            logger.error("Error streaming audio file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to stream audio file", e);
        }
    }

    private static boolean AudioFormatsEqual(AudioFormat a, AudioFormat b) {
        if (a == null || b == null) return false;
        return a.getEncoding().equals(b.getEncoding())
                && (int)a.getSampleRate() == (int)b.getSampleRate()
                && a.getSampleSizeInBits() == b.getSampleSizeInBits()
                && a.getChannels() == b.getChannels()
                && a.isBigEndian() == b.isBigEndian();
    }
}
