package com.example.difyproxy.service;

import com.example.difyproxy.exception.DifyApiException;
import com.example.difyproxy.model.response.ConversationListResponse;
import com.example.difyproxy.model.response.ConversationResponse;
import com.example.difyproxy.model.response.ConversationVariableListResponse;
import com.example.difyproxy.model.response.MessageListResponse;
import com.example.difyproxy.model.response.MessageResponse;
import com.example.difyproxy.model.response.RenameConversationRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */
@Service
@Slf4j
public class ConversationService {

    private final WebClient difyWebClient;
    @Value("${app.dify.auth-token}")
    private String authToken;

    @Value("${app.dify.conversations}")
    private String conversations;

    public ConversationService(WebClient difyWebClient) {
        this.difyWebClient = difyWebClient;
    }

    // 获取会话历史列表
    public Mono<ConversationListResponse> getConversations(
            String lastId, Integer limit, String userId, String sortBy) {

        StringBuilder path = new StringBuilder(conversations +"?user="+userId);
        if(lastId != null ) {
            path.append("&lastId="+lastId);
        }
        if(limit != null ) {
            path.append("&limit="+limit);
        }
        if (sortBy != null) {
            path.append("&sort_by="+sortBy);
        }

        return difyWebClient.get()
                .uri(path.toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .retrieve()
                .onStatus(HttpStatus::isError, this::handleError)
                .bodyToMono(ConversationListResponse.class)
                .doOnSuccess(response -> log.info("成功获取会话列表"))
                .doOnError(error -> log.error("获取会话列表失败", error));
    }

    /**
     * 获取消息列表
     * @param user 用户ID
     * @param conversationId 会话ID
     * @return 消息列表响应
     */
    public Mono<MessageListResponse> getMessages(String conversationId,String user) {

        return difyWebClient.get()
                .uri("v1/messages?conversation_id="+conversationId+"&user="+user)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .retrieve()
                .onStatus(HttpStatus::isError, this::handleError)
                .bodyToMono(MessageListResponse.class)
                .doOnSuccess(response -> log.info("成功获取消息列表，共{}条",
                        response.getData() != null ? response.getData().size() : 0))
                .doOnError(error -> log.error("获取消息列表失败", error));
    }

    // 获取特定消息详情
    public Mono<MessageResponse> getMessageDetail(String conversationId, String messageId) {
        return difyWebClient.get()
                .uri("/conversations/{conversationId}/messages/{messageId}",
                        conversationId, messageId)
                .retrieve()
                .onStatus(HttpStatus::isError, this::handleError)
                .bodyToMono(MessageResponse.class)
                .doOnSuccess(response -> log.info("成功获取消息详情: {}", messageId))
                .doOnError(error -> log.error("获取消息详情失败: {}", messageId, error));
    }

    // 删除会话
    public Mono<Void> deleteConversation(String conversationId, String userId) {
        String requestBody = "{" +
                "\"user\": "+ userId +"}";
//        return difyWebClient.method(HttpMethod.DELETE)
//                .uri("/conversations/"+ conversationId)
//                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
//                .header("Content-Type", "application/json")
//                .bodyValue(requestBody)
//                .retrieve()
//                .onStatus(HttpStatus::isError, this::handleError)
//                .bodyToMono(Void.class)
//                .doOnSuccess(response -> log.info("成功删除会话: {}", conversationId))
//                .doOnError(error -> log.error("删除会话失败: {}", conversationId, error));
        Map request = new HashMap<String,String>();
        request.put("user",userId);

        return difyWebClient.method(HttpMethod.DELETE)
                .uri("/v1/conversations/"+conversationId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatus::isError, this::handleError)
                .bodyToMono(Void.class)
                .doOnSuccess(response -> log.info("成功删除会话: {}, 用户: {}", conversationId, userId))
                .doOnError(error -> log.error("删除会话失败: {}, 用户: {}", conversationId, userId, error));
    }

    // 重命名会话
    public Mono<ConversationResponse> renameConversation(String conversationId,
                                                         RenameConversationRequest request) {
        return difyWebClient.patch()
                .uri("/conversations/{conversationId}", conversationId)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatus::isError, this::handleError)
                .bodyToMono(ConversationResponse.class)
                .doOnSuccess(response -> log.info("成功重命名会话: {}", conversationId))
                .doOnError(error -> log.error("重命名会话失败: {}", conversationId, error));
    }

    /**
     * 获取对话变量
     * @param conversationId 对话ID
     * @param user 用户标识符
     * @param lastId 当前页最后面一条记录的ID（可选）
     * @param limit 一次请求返回多少条记录（可选，默认20，最大100，最小1）
     * @param variableName 变量名称（可选，用于过滤特定变量）
     * @return 对话变量列表响应
     */
    public Mono<ConversationVariableListResponse> getConversationVariables(
            String conversationId, String user, String lastId, Integer limit, String variableName) {
        
        // 构建URI，使用UriComponentsBuilder确保URL编码正确
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromPath("/v1/conversations/{conversationId}/variables")
                .queryParam("user", user);
        
        if (lastId != null && !lastId.trim().isEmpty()) {
            uriBuilder.queryParam("last_id", lastId);
        }
        
        if (limit != null) {
            // 限制limit的范围：最小1，最大100
            int validLimit = Math.max(1, Math.min(100, limit));
            uriBuilder.queryParam("limit", validLimit);
        }
        
        if (variableName != null && !variableName.trim().isEmpty()) {
            uriBuilder.queryParam("variable_name", variableName);
        }
        
        String uri = uriBuilder.buildAndExpand(conversationId).toUriString();
        
        log.info("获取对话变量 - 对话ID: {}, 用户: {}, URI: {}", conversationId, user, uri);
        
        return difyWebClient.get()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + authToken)
                .retrieve()
                .onStatus(HttpStatus::isError, this::handleError)
                .bodyToMono(ConversationVariableListResponse.class)
                .doOnSuccess(response -> log.info("成功获取对话变量，共{}条", 
                        response.getData() != null ? response.getData().size() : 0))
                .doOnError(error -> log.error("获取对话变量失败: 对话ID={}, 用户={}", conversationId, user, error));
    }

    // 错误处理
    private Mono<? extends Throwable> handleError(ClientResponse response) {
        return response.bodyToMono(String.class)
                .map(body -> {
                    log.error("API调用失败: {} - {}", response.statusCode(), body);

                    // 尝试解析错误信息
                    String errorCode = null;
                    String originalMessage = body;

                    try {
                        // 如果响应是JSON格式，尝试解析错误码
                        if (body.startsWith("{")) {
                            ObjectMapper mapper = new ObjectMapper();
                            JsonNode jsonNode = mapper.readTree(body);
                            if (jsonNode.has("code")) {
                                errorCode = jsonNode.get("code").asText();
                            }
                            if (jsonNode.has("message")) {
                                originalMessage = jsonNode.get("message").asText();
                            }
                        }
                    } catch (Exception e) {
                        log.warn("解析错误响应失败: {}", e.getMessage());
                    }

                    return (Throwable) new DifyApiException(
                            "Dify API调用失败: " + response.statusCode() + " - " + originalMessage,
                            response.statusCode(),
                            errorCode,
                            originalMessage
                    );
                })
                .onErrorReturn(new DifyApiException(
                        "Dify API调用失败: " + response.statusCode(),
                        response.statusCode()
                ));
    }
}
