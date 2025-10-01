package com.bucha.pronunciation;

import com.alibaba.fastjson.JSONObject;

public class IseGlobalMessageBuilder {
    /**
     * Build the first frame message for ISE Global API (status=0)
     */
    public static JSONObject buildFirstFrame(String appId, String sub, String ent, String category, String text,
                                             String tte) {
        JSONObject common = new JSONObject();
        common.put("app_id", appId);

        // Add UTF-8 BOM to text for Chinese
        String textWithBom = "\uFEFF" + text;

        JSONObject business = new JSONObject();
        business.put("sub", sub);
        business.put("ent", ent);
        business.put("category", category);
        business.put("cmd", "ssb");
        business.put("tte", tte);
        business.put("text", textWithBom); // <-- Thêm BOM ở đây
        business.put("ttp_skip", true);
        business.put("aue", "raw");
        business.put("auf", "audio/L16;rate=16000");
        business.put("rstcd", "utf8");

        JSONObject data = new JSONObject();
        data.put("status", 0);

        JSONObject msg = new JSONObject();
        msg.put("common", common);
        msg.put("business", business);
        msg.put("data", data);
        return msg;
    }

    /**
     * Build audio frame message for ISE Global API (status=1 or 2)
     */
    public static JSONObject buildAudioFrame(byte[] audio, int status) {
        JSONObject data = new JSONObject();
        data.put("status", status); // 1: middle, 2: last
        data.put("data", java.util.Base64.getEncoder().encodeToString(audio));
        JSONObject msg = new JSONObject();
        msg.put("data", data);
        return msg;
    }
}
