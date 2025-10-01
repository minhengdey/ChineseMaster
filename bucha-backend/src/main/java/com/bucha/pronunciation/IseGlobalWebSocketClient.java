package com.bucha.pronunciation;

import okhttp3.*;
import okio.ByteString;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import com.alibaba.fastjson.JSONObject;
import java.util.Base64;

public class IseGlobalWebSocketClient {
    private final String wsUrl;
    private final WebSocketListener listener;
    private WebSocket webSocket;
    private OkHttpClient client;

    public IseGlobalWebSocketClient(String wsUrl, WebSocketListener listener) {
        this.wsUrl = wsUrl;
        this.listener = listener;
        this.client = new OkHttpClient.Builder().readTimeout(60, TimeUnit.SECONDS).build();
    }

    public void connect() {
        Request request = new Request.Builder().url(wsUrl).build();
        webSocket = client.newWebSocket(request, listener);
    }

    public void sendJson(JSONObject json) {
        if (webSocket != null) {
            webSocket.send(json.toJSONString());
        }
    }

    public void sendAudio(byte[] audio, int status) {
        JSONObject audioFrame = IseGlobalMessageBuilder.buildAudioFrame(audio, status);
        sendJson(audioFrame);
    }

    public void close() {
        if (webSocket != null) {
            webSocket.close(1000, "Normal closure");
        }
    }
}
