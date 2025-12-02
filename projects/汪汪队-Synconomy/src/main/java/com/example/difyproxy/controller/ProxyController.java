package com.example.difyproxy.controller;

import com.example.difyproxy.common.CommonResponse;
import com.example.difyproxy.model.StopChatRequest;
import com.example.difyproxy.model.UploadResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.logging.Logger;

@RestController
@RequestMapping("/v1")
@Validated
public class ProxyController {

    private static final Logger logger = Logger.getLogger(ProxyController.class.getName());
    private final WebClient difyWebClient;

    @Value("${app.dify.upload-path}")
    private String uploadPath;

    @Value("${app.dify.chat-path}")
    private String chatPath;

    @Value("${app.dify.auth-token}")
    private String authToken;

    public ProxyController(WebClient difyWebClient) {
        this.difyWebClient = difyWebClient;
    }

    @PostMapping(value = "/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<CommonResponse<UploadResult>>> uploadFile(
            @RequestPart("file") FilePart file,
            @RequestPart("userId") @NotEmpty(message = "用户标识不能为空") String userId) {
        // 验证文件类型
        String contentType = file.headers().getContentType() != null ? 
            file.headers().getContentType().toString() : "";
        String filename = file.filename();
        
        logger.info("收到文件上传请求 - 文件名: " + filename + ", Content-Type: " + contentType);
        
        // 支持的文件类型
        if (!isSupportedFileType(contentType, filename)) {
            logger.warning("不支持的文件类型: " + contentType + ", 文件名: " + filename);
            CommonResponse<UploadResult> errorResponse = CommonResponse.error(400, 
                "不支持的文件类型: " + contentType + ". 支持的类型: Excel文件(.xlsx, .xls), PDF文件(.pdf), 文本文件(.txt, .csv)");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }
        
        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
        formData.add("file", file);
        formData.add("user", userId);

        logger.info("开始上传文件到Dify服务器: " + uploadPath);

        return difyWebClient.post()
                .uri(uploadPath)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .body(BodyInserters.fromMultipartData(formData))
                .exchangeToMono(this::mapToCommonResponse)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                        .filter(throwable -> {
                            if (throwable instanceof WebClientResponseException) {
                                WebClientResponseException ex = (WebClientResponseException) throwable;
                                return ex.getStatusCode().is5xxServerError();
                            }
                            // 重试连接相关的异常
                            return throwable.getMessage() != null &&
                                    (throwable.getMessage().contains("Connection refused") ||
                                            throwable.getMessage().contains("timeout") ||
                                            throwable.getMessage().contains("Connection reset"));
                        })
                        .doBeforeRetry(retrySignal -> {
                            logger.warning("上传文件失败，正在重试第 " + retrySignal.totalRetries() + " 次: " +
                                    retrySignal.failure().getMessage());
                        }))
                .doOnSuccess(response -> logger.info("文件上传成功"))
                .doOnError(error -> logger.severe("文件上传最终失败: " + error.getMessage()));
    }

    public static class ChatRequest {
        @NotEmpty(message = "查询内容不能为空")
        private String query;

        @NotEmpty(message = "用户标识不能为空")
        private String userId;

        private String upload_file_id;

        private String conversation_id;

        public ChatRequest() {}

        public ChatRequest(String query, String upload_file_id) {
            this.query = query;
            this.upload_file_id = upload_file_id;
        }

        public ChatRequest(String query, String upload_file_id, String conversation_id) {
            this.query = query;
            this.upload_file_id = upload_file_id;
            this.conversation_id = conversation_id;
        }

        public ChatRequest(String query, String userId, String upload_file_id, String conversation_id) {
            this.query = query;
            this.userId = userId;
            this.upload_file_id = upload_file_id;
            this.conversation_id = conversation_id;
        }

        public String getQuery() {
            return query;
        }

        public void setQuery(String query) {
            this.query = query;
        }

        public String getUpload_file_id() {
            return upload_file_id;
        }

        public void setUpload_file_id(String upload_file_id) {
            this.upload_file_id = upload_file_id;
        }

        public String getConversation_id() {
            return conversation_id;
        }

        public void setConversation_id(String conversation_id) {
            this.conversation_id = conversation_id;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }
    }

    @PostMapping(value = "/chat-messages", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Mono<ResponseEntity<Flux<String>>> startChat(@RequestBody @Valid ChatRequest req) {
        String dataField;
        String filesField;

        if (req.getUpload_file_id() == null || req.getUpload_file_id().trim().isEmpty()) {
            // 当upload_file_id为空时，data字段为空，files字段为空数组
            dataField = null;
            filesField = "[]";
        } else {
            // 当upload_file_id不为空时，使用原来的逻辑
            dataField = "{" +
                    "\"type\": \"document\"," +
                    "\"transfer_method\": \"local_file\"," +
                    "\"upload_file_id\": " + quote(req.getUpload_file_id()) +
                    "}";
            filesField = "[{" +
                    "\"type\": \"document\"," +
                    "\"transfer_method\": \"local_file\"," +
                    "\"upload_file_id\": " + quote(req.getUpload_file_id()) +
                    "}]";
        }

        // 处理conversation_id：如果为空或null，则使用空字符串（新对话），否则使用提供的conversation_id（继续对话）
        String conversationId = (req.getConversation_id() == null || req.getConversation_id().trim().isEmpty()) 
                ? "" 
                : req.getConversation_id();

        String payload = "{" +
                "\"inputs\": {" +
                "\"query\": " + quote(req.getQuery()) + "," +
                "\"data\": " + dataField + "," +
                "\"userName\": " + quote(req.getUserId()) +
                "}," +
                "\"query\": " + quote(req.getQuery()) + "," +
                "\"response_mode\": \"streaming\"," +
                "\"conversation_id\": " + quote(conversationId) + "," +
                "\"user\": " + quote(req.getUserId()) + "," +
                "\"files\": " + filesField +
                "}";

        if (conversationId.isEmpty()) {
            logger.info("开始新对话请求到Dify服务器: " + chatPath);
        } else {
            logger.info("继续对话请求到Dify服务器: " + chatPath + ", conversation_id: " + conversationId);
        }

        Flux<String> stream = difyWebClient.post()
                .uri(chatPath)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(payload)
                .retrieve()
                .bodyToFlux(String.class)
                // 将上游数据中的多个换行折叠为单个换行
                .map(chunk -> chunk.replaceAll("(\\r?\\n){2,}", "\n"))
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                        .filter(throwable -> {
                            if (throwable instanceof WebClientResponseException) {
                                WebClientResponseException ex = (WebClientResponseException) throwable;
                                return ex.getStatusCode().is5xxServerError();
                            }
                            // 重试连接相关的异常
                            return throwable.getMessage() != null &&
                                    (throwable.getMessage().contains("Connection refused") ||
                                            throwable.getMessage().contains("timeout") ||
                                            throwable.getMessage().contains("Connection reset"));
                        })
                        .doBeforeRetry(retrySignal -> {
                            logger.warning("聊天请求失败，正在重试第 " + retrySignal.totalRetries() + " 次: " +
                                    retrySignal.failure().getMessage());
                        }))
                .doOnNext(chunk -> logger.info("聊天SSE收到数据: " + chunk))
                .doOnSubscribe(subscription -> logger.info("聊天请求开始"))
                .doOnError(error -> logger.severe("聊天请求最终失败: " + error.getMessage()))
                .onErrorResume(error -> {
                    String message = error.getMessage() == null ? "unknown error" : error.getMessage();
                    String errorPayload = "{\"error\": " + quote(message) + "}";
                    String errorEvent = "event: error\n" + "data: " + errorPayload + "\n\n";
                    return Flux.just(errorEvent);
                });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_EVENT_STREAM);
        headers.set("Cache-Control", "no-cache, no-transform");
        headers.set("Connection", "keep-alive");
        headers.set("X-Accel-Buffering", "no");

        return Mono.just(ResponseEntity.status(HttpStatus.OK)
                .headers(headers)
                .body(stream));
    }

    @PostMapping(value = "/chat-messages/{task_id}/stop", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<CommonResponse<String>>> stopChat(
            @PathVariable("task_id") String taskId,
            @RequestBody @Valid StopChatRequest request) {
        
        // 用户信息必须从请求中获取
        if (request == null || !request.hasUserId()) {
            logger.warning("收到停止聊天请求 - 任务ID: " + taskId + ", 但用户标识为空");
            CommonResponse<String> errorResponse = CommonResponse.error(400, "用户标识不能为空");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }
        
        String userIdToUse = request.getUserId();
        logger.info("收到停止聊天请求 - 任务ID: " + taskId + ", 用户: " + userIdToUse);
        
        // 构建停止请求的payload
        String payload = "{" +
                "\"user\": " + quote(userIdToUse) +
                "}";
        
        // 构建停止聊天的URL
        String stopUrl = chatPath.replace("/chat-messages", "/chat-messages/" + taskId + "/stop");
        
        logger.info("开始发送停止请求到Dify服务器: " + stopUrl);
        
        return difyWebClient.post()
                .uri(stopUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .map(responseBody -> {
                    logger.info("停止聊天请求成功: " + responseBody);
                    CommonResponse<String> successResponse = CommonResponse.success("聊天响应已停止", responseBody);
                    return ResponseEntity.ok(successResponse);
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                        .filter(throwable -> {
                            if (throwable instanceof WebClientResponseException) {
                                WebClientResponseException ex = (WebClientResponseException) throwable;
                                return ex.getStatusCode().is5xxServerError();
                            }
                            // 重试连接相关的异常
                            return throwable.getMessage() != null &&
                                    (throwable.getMessage().contains("Connection refused") ||
                                            throwable.getMessage().contains("timeout") ||
                                            throwable.getMessage().contains("Connection reset"));
                        })
                        .doBeforeRetry(retrySignal -> {
                            logger.warning("停止聊天请求失败，正在重试第 " + retrySignal.totalRetries() + " 次: " +
                                    retrySignal.failure().getMessage());
                        }))
                .doOnError(error -> logger.severe("停止聊天请求最终失败: " + error.getMessage()))
                .onErrorResume(error -> {
                    String message = error.getMessage() == null ? "停止聊天请求失败" : error.getMessage();
                    CommonResponse<String> errorResponse = CommonResponse.error(500, message);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
                });
    }

    private Mono<ResponseEntity<CommonResponse<UploadResult>>> mapToCommonResponse(ClientResponse response) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .map(body -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        logger.info("上传接口收到成功响应: " + body);
                        try {
                            // 解析JSON响应为UploadResult对象
                            ObjectMapper objectMapper = new ObjectMapper();
                            UploadResult uploadResult = objectMapper.readValue(body, UploadResult.class);
                            CommonResponse<UploadResult> commonResponse = CommonResponse.success("文件上传成功", uploadResult);
                            return ResponseEntity.status(HttpStatus.OK).body(commonResponse);
                        } catch (Exception e) {
                            logger.warning("解析上传响应JSON失败: " + e.getMessage() + ", 原始响应: " + body);
                            // 如果解析失败，创建一个包含原始响应的UploadResult对象
                            UploadResult fallbackResult = new UploadResult();
                            fallbackResult.setId("unknown");
                            fallbackResult.setName("解析失败");
                            CommonResponse<UploadResult> commonResponse = CommonResponse.success("文件上传成功，但解析响应失败", fallbackResult);
                            return ResponseEntity.status(HttpStatus.OK).body(commonResponse);
                        }
                    } else {
                        logger.warning("上传接口收到非成功状态(" + response.statusCode() + "): " + body);
                        CommonResponse<UploadResult> commonResponse = CommonResponse.error(response.statusCode().value(), "文件上传失败: " + body);
                        return ResponseEntity.status(response.statusCode()).body(commonResponse);
                    }
                });
    }

    private static String quote(String text) {
        return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
    
    /**
     * 验证文件类型是否支持
     * @param contentType 文件的Content-Type
     * @param filename 文件名
     * @return 是否支持该文件类型
     */
    private boolean isSupportedFileType(String contentType, String filename) {
        // 支持的文件类型列表
        String[] supportedTypes = {
            // Excel文件
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            // PDF文件
            "application/pdf",
            // 文本文件
            "text/plain", // .txt
            "text/csv", // .csv
            "application/csv",
            // 其他常见文档类型
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-powerpoint", // .ppt
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" // .pptx
        };
        
        // 检查Content-Type
        for (String supportedType : supportedTypes) {
            if (contentType.toLowerCase().contains(supportedType.toLowerCase())) {
                return true;
            }
        }
        
        // 如果Content-Type检查失败，尝试通过文件扩展名检查
        if (filename != null) {
            String lowerFilename = filename.toLowerCase();
            String[] supportedExtensions = {".xlsx", ".xls", ".pdf", ".txt", ".csv", ".doc", ".docx", ".ppt", ".pptx"};
            for (String ext : supportedExtensions) {
                if (lowerFilename.endsWith(ext)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}


