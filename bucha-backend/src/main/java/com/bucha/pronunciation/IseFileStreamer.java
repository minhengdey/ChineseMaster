package com.bucha.pronunciation;

import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sound.sampled.*;
import java.io.*;
import java.util.Base64;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

public class IseFileStreamer {
    private static final Logger logger = LoggerFactory.getLogger(IseFileStreamer.class);

    // Keep chunk size as 1280 (40ms @16kHz 16-bit mono) to be compatible with many speech APIs.
    private static final int CHUNK_SIZE = 1280;
    // producer-consumer queue capacity: tune this to control memory vs throughput
    private static final int QUEUE_CAPACITY = 128;
    // log progress every N frames
    private static final int LOG_INTERVAL_FRAMES = 50;

    private static class Frame {
        final byte[] data;
        final boolean last;

        Frame(byte[] data, boolean last) {
            this.data = data;
            this.last = last;
        }
    }

    /**
     * Stream audioFile to remote via sendJsonConsumer.
     * Optimized: uses producer-consumer queue to decouple file read from network send.
     *
     * streamCancelled: caller controls this flag; when true streamer must stop ASAP.
     * sendJsonConsumer: accepts String JSON to send via websocket.
     */
    public static void streamFile(File audioFile,
                                  Consumer<String> sendJsonConsumer,
                                  String appId,
                                  String text,
                                  AtomicBoolean streamCancelled) {
        logger.info("Starting to stream file: {} (size: {} bytes)", audioFile.getName(), audioFile.length());

        final BlockingQueue<Frame> queue = new ArrayBlockingQueue<>(QUEUE_CAPACITY);

        Thread producer = null;
        Thread sender = null;

        AudioInputStream rawAis = null;
        AudioInputStream convertedAis = null;

        try {
            // Open raw audio input stream (no try-with-resources here so we can decide which stream to close)
            rawAis = AudioSystem.getAudioInputStream(audioFile);
            AudioFormat sourceFormat = rawAis.getFormat();
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

            AudioInputStream aisToUse;
            // Try to convert to target format; if conversion fails, fallback to raw
            if (!AudioFormatsEqual(sourceFormat, targetFormat)) {
                try {
                    convertedAis = AudioSystem.getAudioInputStream(targetFormat, rawAis);
                    logger.info("Converted audio to target format: {}", targetFormat);
                    // We will close convertedAis in the try-with-resources below; avoid closing rawAis again
                    aisToUse = convertedAis;
                    rawAis = null;
                } catch (Exception ex) {
                    logger.warn("Conversion to targetFormat failed, using original stream: {}", ex.getMessage());
                    // fallback: use rawAis as the stream to use
                    aisToUse = rawAis;
                    // keep rawAis not null so we close it in finally via closing aisToUse below
                }
            } else {
                aisToUse = rawAis;
                rawAis = null; // transfer ownership to aisToUse
            }

            final AudioInputStream ais = aisToUse;
            final AtomicBoolean localCancel = streamCancelled != null ? streamCancelled : new AtomicBoolean(false);

            // Sender thread: takes frames from queue, encodes base64 + build JSON + send
            sender = new Thread(() -> {
                long framesSent = 0;
                try {
                    while (true) {
                        if (localCancel.get()) {
                            logger.info("Sender observed cancellation, stopping.");
                            break;
                        }
                        Frame f = queue.take(); // blocks if queue empty
                        // sentinel frame: data==null && last==true indicates producer done
                        if (f.data == null && f.last) break;

                        // Build JSON in sender thread
                        String base64Audio = Base64.getEncoder().encodeToString(f.data);
                        JSONObject frame = new JSONObject();

                        JSONObject business = new JSONObject();
                        business.put("cmd", "auw");
                        int aus = (framesSent == 0) ? 1 : 2;
                        if (f.last) aus = 4;
                        business.put("aus", aus);
                        frame.put("business", business);

                        JSONObject data = new JSONObject();
                        data.put("status", f.last ? 2 : 1);
                        data.put("data", base64Audio);
                        frame.put("data", data);

                        if (framesSent == 0) {
                            String preview = frame.toJSONString();
                            logger.info("First audio-frame preview ({} chars): {}",
                                    Math.min(600, preview.length()), preview.substring(0, Math.min(600, preview.length())));
                        }

                        try {
                            sendJsonConsumer.accept(frame.toJSONString());
                        } catch (Throwable sendEx) {
                            logger.warn("Failed to send audio frame seq={} due to: {}", framesSent, sendEx.getMessage());
                            localCancel.set(true);
                            break;
                        }

                        framesSent++;
                        if ((framesSent % LOG_INTERVAL_FRAMES) == 0) {
                            logger.info("Sender: sent {} frames so far", framesSent);
                        }

                        if (f.last) {
                            logger.info("Sender: last frame sent (framesSent={})", framesSent);
                            break;
                        }
                    }
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    logger.warn("Sender interrupted");
                } catch (Throwable t) {
                    logger.error("Sender thread error", t);
                    localCancel.set(true);
                } finally {
                    // try to send explicit final empty end-marker if not already sent and not cancelled
                    try {
                        if (!localCancel.get()) {
                            JSONObject endFrame = new JSONObject();
                            JSONObject business = new JSONObject();
                            business.put("cmd", "auw");
                            business.put("aus", 4);
                            endFrame.put("business", business);
                            JSONObject data = new JSONObject();
                            data.put("status", 2);
                            data.put("data", "");
                            endFrame.put("data", data);
                            try {
                                sendJsonConsumer.accept(endFrame.toJSONString());
                                logger.info("Sender: explicit end-marker frame sent.");
                            } catch (Throwable ex) {
                                logger.warn("Sender: failed to send explicit end marker: {}", ex.getMessage());
                            }
                        }
                    } catch (Throwable ex) {
                        // ignore
                    }
                }
            }, "ise-sender-thread");
            sender.setDaemon(true);
            sender.start();

            // Producer: read bytes from ais and put frames into queue
            producer = new Thread(() -> {
                long totalBytesRead = 0;
                long totalFrames = 0;
                byte[] buf = new byte[CHUNK_SIZE];
                try {
                    int read;
                    while (!localCancel.get() && (read = ais.read(buf, 0, CHUNK_SIZE)) != -1) {
                        totalBytesRead += read;
                        byte[] frameData;
                        if (read == CHUNK_SIZE) {
                            frameData = new byte[CHUNK_SIZE];
                            System.arraycopy(buf, 0, frameData, 0, CHUNK_SIZE);
                        } else {
                            frameData = new byte[read];
                            System.arraycopy(buf, 0, frameData, 0, read);
                        }

                        boolean last = (read < CHUNK_SIZE);
                        // will block when queue is full - backpressure
                        try {
                            queue.put(new Frame(frameData, last));
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            localCancel.set(true);
                            break;
                        }

                        totalFrames++;
                        if (last) break;
                    }

                    // enqueue sentinel to stop sender if not already
                    try {
                        queue.put(new Frame(null, true)); // sentinel
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }

                    double estimatedSeconds = (double) totalBytesRead / (16000.0 * 2.0);
                    logger.info("Producer finished reading. totalFrames={}, totalBytes={}, estimatedSeconds={}",
                            totalFrames, totalBytesRead, estimatedSeconds);
                } catch (IOException ioe) {
                    logger.error("Producer IO error while reading audio", ioe);
                    localCancel.set(true);
                    try {
                        queue.put(new Frame(null, true));
                    } catch (InterruptedException ignored) {}
                }
            }, "ise-producer-thread");
            producer.setDaemon(true);
            producer.start();

            // Use try-with-resources to ensure ais closed once when finished
            try (AudioInputStream toUse = ais) {
                // wait loop: exit when both threads finish or external cancel
                while (true) {
                    if (streamCancelled != null && streamCancelled.get()) {
                        logger.info("External cancel requested, breaking wait loop");
                        break;
                    }
                    if (!producer.isAlive() && !sender.isAlive()) break;
                    try {
                        Thread.sleep(50);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }

        } catch (UnsupportedAudioFileException uafe) {
            logger.error("Unsupported audio file: {}", uafe.getMessage(), uafe);
            throw new RuntimeException("Unsupported audio file", uafe);
        } catch (Exception e) {
            logger.error("Error streaming audio file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to stream audio file", e);
        } finally {
            // close any rawAis left (if conversion failed and rawAis wasn't transferred)
            try {
                if (rawAis != null) rawAis.close();
            } catch (Throwable ignored) {}
            try {
                if (convertedAis != null && convertedAis != rawAis) convertedAis.close();
            } catch (Throwable ignored) {}
            // interrupt threads if still alive
            try { if (producer != null && producer.isAlive()) producer.interrupt(); } catch (Throwable ignored) {}
            try { if (sender != null && sender.isAlive()) sender.interrupt(); } catch (Throwable ignored) {}
            logger.info("streamFile finished/cleaned up for {}", audioFile.getName());
        }
    }

    private static boolean AudioFormatsEqual(AudioFormat a, AudioFormat b) {
        if (a == null || b == null) return false;
        return a.getEncoding().equals(b.getEncoding())
                && (int) a.getSampleRate() == (int) b.getSampleRate()
                && a.getSampleSizeInBits() == b.getSampleSizeInBits()
                && a.getChannels() == b.getChannels()
                && a.isBigEndian() == b.isBigEndian();
    }
}
