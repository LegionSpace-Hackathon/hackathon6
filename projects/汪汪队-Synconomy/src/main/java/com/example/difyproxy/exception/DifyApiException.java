package com.example.difyproxy.exception;

import org.springframework.http.HttpStatus;
/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */

/**
 * Dify API调用异常类
 * 用于封装Dify API调用过程中发生的各种异常
 */
public class DifyApiException extends RuntimeException {

    private final HttpStatus statusCode;
    private final String errorCode;
    private final String originalMessage;

    /**
     * 构造函数
     * @param message 异常消息
     * @param statusCode HTTP状态码
     */
    public DifyApiException(String message, HttpStatus statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = null;
        this.originalMessage = null;
    }

    /**
     * 构造函数
     * @param message 异常消息
     * @param statusCode HTTP状态码
     * @param errorCode 错误码
     */
    public DifyApiException(String message, HttpStatus statusCode, String errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.originalMessage = null;
    }

    /**
     * 构造函数
     * @param message 异常消息
     * @param statusCode HTTP状态码
     * @param errorCode 错误码
     * @param originalMessage 原始错误消息
     */
    public DifyApiException(String message, HttpStatus statusCode, String errorCode, String originalMessage) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.originalMessage = originalMessage;
    }

    /**
     * 构造函数
     * @param message 异常消息
     * @param cause 原因异常
     * @param statusCode HTTP状态码
     */
    public DifyApiException(String message, Throwable cause, HttpStatus statusCode) {
        super(message, cause);
        this.statusCode = statusCode;
        this.errorCode = null;
        this.originalMessage = null;
    }

    /**
     * 获取HTTP状态码
     * @return HTTP状态码
     */
    public HttpStatus getStatusCode() {
        return statusCode;
    }

    /**
     * 获取错误码
     * @return 错误码
     */
    public String getErrorCode() {
        return errorCode;
    }

    /**
     * 获取原始错误消息
     * @return 原始错误消息
     */
    public String getOriginalMessage() {
        return originalMessage;
    }

    /**
     * 判断是否为客户端错误（4xx）
     * @return 是否为客户端错误
     */
    public boolean isClientError() {
        return statusCode.is4xxClientError();
    }

    /**
     * 判断是否为服务器错误（5xx）
     * @return 是否为服务器错误
     */
    public boolean isServerError() {
        return statusCode.is5xxServerError();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("DifyApiException{");
        sb.append("message='").append(getMessage()).append("'");
        sb.append(", statusCode=").append(statusCode);
        if (errorCode != null) {
            sb.append(", errorCode='").append(errorCode).append("'");
        }
        if (originalMessage != null) {
            sb.append(", originalMessage='").append(originalMessage).append("'");
        }
        sb.append("}");
        return sb.toString();
    }
}
