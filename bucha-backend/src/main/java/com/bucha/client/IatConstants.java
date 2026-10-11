package com.bucha.client;

/**
 * iFlytek IAT (语音听写) parameters aligned with official SDK / WebAPI convention.
 * Reference: Xunfei_Voice demo (language zh_cn, accent mandarin) and
 * <a href="https://www.xfyun.cn/doc/asr/voicedictation/API.html">语音听写流式版 WebAPI</a>.
 */
public final class IatConstants {

    private IatConstants() {}

    /** Language: Chinese (same as SpeechConstant.LANGUAGE in SDK demo). */
    public static final String LANGUAGE_ZH_CN = "zh_cn";
    /** Accent: Mandarin (same as SpeechConstant.ACCENT in SDK demo). */
    public static final String ACCENT_MANDARIN = "mandarin";
    /** Domain: daily IAT. */
    public static final String DOMAIN_IAT = "iat";

    /** Audio format for 16kHz 16-bit mono (IAT requirement). */
    public static final String FORMAT_16K = "audio/L16;rate=16000";
    /** Raw PCM encoding. */
    public static final String ENCODING_RAW = "raw";

    /** Chunk size: 1280 bytes = 40ms @ 16kHz 16-bit mono (recommended in IAT doc). */
    public static final int FRAME_SIZE = 1280;
}
