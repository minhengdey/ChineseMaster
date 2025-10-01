package com.bucha.pronunciation;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class IseGlobalUrlSigner {

    public static String generateSignedUrl(String host, String apiKey, String apiSecret, String requestPath)
            throws Exception {
        String date = getRfc1123Time();
        String signatureOrigin = "host: " + host + "\n" +
                "date: " + date + "\n" +
                "GET " + requestPath + " HTTP/1.1";
        String signature = base64HmacSha256(signatureOrigin, apiSecret);
        String authorizationOrigin = String.format(
                "api_key=\"%s\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"%s\"",
                apiKey, signature);
        String authorization = Base64.getEncoder().encodeToString(authorizationOrigin.getBytes(StandardCharsets.UTF_8));
        String url = String.format(
                "wss://%s%s?authorization=%s&date=%s&host=%s",
                host,
                requestPath,
                URLEncoder.encode(authorization, "UTF-8"),
                URLEncoder.encode(date, "UTF-8"),
                URLEncoder.encode(host, "UTF-8"));
        return url;
    }

    private static String base64HmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }

    private static String getRfc1123Time() {
        SimpleDateFormat df = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
        df.setTimeZone(TimeZone.getTimeZone("GMT"));
        return df.format(new Date());
    }
}
