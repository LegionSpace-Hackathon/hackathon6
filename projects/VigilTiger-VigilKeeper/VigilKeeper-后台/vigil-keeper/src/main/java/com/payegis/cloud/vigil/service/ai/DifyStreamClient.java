package com.payegis.cloud.vigil.service.ai;

// 使用WebSocket实现流式响应
import javax.websocket.*;
import java.net.URI;

@ClientEndpoint
public class DifyStreamClient {
    private Session session;

    public void connect(String wsUrl) throws Exception {
        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        container.connectToServer(this, new URI(wsUrl));
    }

    @OnOpen
    public void onOpen(Session session) {
        this.session = session;
        System.out.println("连接已建立");
    }

    @OnMessage
    public void onMessage(String message) {
        System.out.println("收到消息: " + message);
    }

    public void sendMessage(String message) throws Exception {
        session.getBasicRemote().sendText(message);
    }
}

