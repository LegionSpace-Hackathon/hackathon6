package com.example.difyproxy.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotEmpty;

/**
 * 停止聊天请求模型
 * userId字段为必填项
 */
public class StopChatRequest {
    
    @NotEmpty(message = "用户标识不能为空")
    private String userId;

    public StopChatRequest() {}

    public StopChatRequest(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    /**
     * 检查是否提供了用户信息
     * @return 如果用户信息不为空且不为空字符串，返回true
     */
    public boolean hasUserId() {
        return userId != null && !userId.trim().isEmpty();
    }

    @Override
    public String toString() {
        return "StopChatRequest{" +
                "userId='" + userId + '\'' +
                '}';
    }
}
