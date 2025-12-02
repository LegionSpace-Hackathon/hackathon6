package com.example.difyproxy.exception;

/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 * 统一处理应用中的各种异常
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 处理DifyApiException异常
     */
    @ExceptionHandler(DifyApiException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleDifyApiException(DifyApiException ex) {
        log.error("Dify API调用异常: {}", ex.getMessage(), ex);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("statusCode", ex.getStatusCode().value());
        errorResponse.put("timestamp", LocalDateTime.now());

        if (ex.getErrorCode() != null) {
            errorResponse.put("errorCode", ex.getErrorCode());
        }

        if (ex.getOriginalMessage() != null) {
            errorResponse.put("originalMessage", ex.getOriginalMessage());
        }

        return Mono.just(ResponseEntity.status(ex.getStatusCode()).body(errorResponse));
    }

    /**
     * 处理WebClientResponseException异常
     */
    @ExceptionHandler(WebClientResponseException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleWebClientResponseException(WebClientResponseException ex) {
        log.error("WebClient响应异常: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", "外部API调用失败: " + ex.getMessage());
        errorResponse.put("statusCode", ex.getStatusCode().value());
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("originalMessage", ex.getResponseBodyAsString());

        return Mono.just(ResponseEntity.status(ex.getStatusCode()).body(errorResponse));
    }

    /**
     * 处理IllegalArgumentException异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("参数异常: {}", ex.getMessage(), ex);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", "参数错误: " + ex.getMessage());
        errorResponse.put("statusCode", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("timestamp", LocalDateTime.now());

        return Mono.just(ResponseEntity.badRequest().body(errorResponse));
    }

    /**
     * 处理ValidationException异常
     */
    @ExceptionHandler(org.springframework.web.bind.support.WebExchangeBindException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleValidationException(
            org.springframework.web.bind.support.WebExchangeBindException ex) {
        log.error("参数验证异常: {}", ex.getMessage(), ex);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", "参数验证失败");
        errorResponse.put("statusCode", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("timestamp", LocalDateTime.now());

        // 添加详细的验证错误信息
        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                validationErrors.put(error.getField(), error.getDefaultMessage()));
        errorResponse.put("validationErrors", validationErrors);

        return Mono.just(ResponseEntity.badRequest().body(errorResponse));
    }

    /**
     * 处理其他未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleGenericException(Exception ex) {
        log.error("未处理的异常: {}", ex.getMessage(), ex);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", "服务器内部错误: " + ex.getMessage());
        errorResponse.put("statusCode", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("timestamp", LocalDateTime.now());

        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
    }
}
