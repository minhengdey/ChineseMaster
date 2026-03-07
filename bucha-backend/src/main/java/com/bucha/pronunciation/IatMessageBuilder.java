package com.bucha.pronunciation;

import com.alibaba.fastjson.JSONObject;
import com.bucha.client.IatConstants;

import java.util.Base64;

/**
 * Builds WebSocket messages for iFlytek IAT (Short Form ASR) v2 API.
 * Connection style follows official convention: first frame carries app_id + business params
 * (language, domain, accent — see Xunfei_Voice / SpeechConstant.LANGUAGE, ACCENT), then data frames.
 * Protocol: first frame = common + business + data (status 0, first audio chunk);
 * subsequent frames = data only (status 1 or 2, audio chunk).
 */
public final class IatMessageBuilder {

    private IatMessageBuilder() {}

    /**
     * First frame: common (app_id), business (language, domain, accent), data (status=0, format, encoding, audio).
     * Params aligned with SDK demo: language zh_cn, accent mandarin.
     */
    public static JSONObject buildFirstFrame(String appId, byte[] firstChunkBase64) {
        JSONObject common = new JSONObject();
        common.put("app_id", appId);

        JSONObject business = new JSONObject();
        business.put("language", IatConstants.LANGUAGE_ZH_CN);
        business.put("domain", IatConstants.DOMAIN_IAT);
        business.put("accent", IatConstants.ACCENT_MANDARIN);

        JSONObject data = new JSONObject();
        data.put("status", 0);
        data.put("format", IatConstants.FORMAT_16K);
        data.put("encoding", IatConstants.ENCODING_RAW);
        data.put("audio", Base64.getEncoder().encodeToString(firstChunkBase64));

        JSONObject msg = new JSONObject();
        msg.put("common", common);
        msg.put("business", business);
        msg.put("data", data);
        return msg;
    }

    /**
     * Audio frame: data only (status 1 = middle, 2 = last).
     */
    public static JSONObject buildAudioFrame(byte[] chunk, boolean last) {
        JSONObject data = new JSONObject();
        data.put("status", last ? 2 : 1);
        data.put("format", IatConstants.FORMAT_16K);
        data.put("encoding", IatConstants.ENCODING_RAW);
        data.put("audio", Base64.getEncoder().encodeToString(chunk));
        JSONObject msg = new JSONObject();
        msg.put("data", data);
        return msg;
    }

    /**
     * End marker: data.status=2 with no audio (session end).
     */
    public static JSONObject buildEndMarker() {
        JSONObject data = new JSONObject();
        data.put("status", 2);
        JSONObject msg = new JSONObject();
        msg.put("data", data);
        return msg;
    }
}
