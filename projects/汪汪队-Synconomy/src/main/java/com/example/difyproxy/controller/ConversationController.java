package com.example.difyproxy.controller;

import com.example.difyproxy.common.CommonResponse;
import com.example.difyproxy.exception.DifyApiException;
import com.example.difyproxy.model.response.ConversationListResponse;
import com.example.difyproxy.model.response.ConversationResponse;
import com.example.difyproxy.model.response.ConversationVariableListResponse;
import com.example.difyproxy.model.response.MessageListResponse;
import com.example.difyproxy.model.response.MessageResponse;
import com.example.difyproxy.model.response.RenameConversationRequest;
import com.example.difyproxy.service.ConversationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;

/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */
@RestController
@RequestMapping("/v1/conversations")
@Slf4j
@Validated
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    /**
     * 会话列表
     * @param lastId
     * @param limit
     * @param userId
     * @param sortBy
     * @return
     */
    @GetMapping
    public Mono<ResponseEntity<CommonResponse<ConversationListResponse>>> getConversations(
            @RequestParam(required = false) String lastId,
            @RequestParam(defaultValue = "20") Integer limit,
            @RequestParam String userId,
            @RequestParam(required = false) String sortBy) {
        return conversationService.getConversations(lastId, limit, userId, sortBy)
                .map(data -> ResponseEntity.ok(CommonResponse.success("获取会话列表成功！",data)))
                .onErrorResume(DifyApiException.class, ex ->
                        Mono.just(ResponseEntity.status(ex.getStatusCode())
                                .body(CommonResponse.error(ex.getStatusCode().value(), ex.getMessage()))));
    }

    /**
     * 会话消息详情
     * @param conversationId
     * @param userId
     * @return
     */
    @GetMapping("/messages/{conversationId}")
    public Mono<ResponseEntity<CommonResponse<MessageListResponse>>> getMessages(
            @PathVariable String conversationId, @RequestParam String userId) {

        return conversationService.getMessages(conversationId,userId)
                .map(data -> ResponseEntity.ok(CommonResponse.success("获取消息列表成功！",data)))
                .onErrorResume(DifyApiException.class, ex ->
                        Mono.just(ResponseEntity.status(ex.getStatusCode())
                                .body(CommonResponse.error(ex.getStatusCode().value(), ex.getMessage()))));
    }


    /**
     * 删除会话
     * @param conversationId
     * @param userId
     * @return
     */
    @DeleteMapping("/{conversationId}")
    public Mono<ResponseEntity<CommonResponse<String>>> deleteConversation(
            @PathVariable String conversationId, @RequestParam String userId) {

        return conversationService.deleteConversation(conversationId, userId)
                .then(Mono.just(ResponseEntity.ok(CommonResponse.success("会话删除成功！","会话删除成功！"))))
                .onErrorResume(DifyApiException.class, ex ->
                        Mono.just(ResponseEntity.status(ex.getStatusCode()).body(CommonResponse.error(ex.getStatusCode().value(),ex.getMessage()))));
    }

    @PatchMapping("/{conversationId}")
    public Mono<ResponseEntity<ConversationResponse>> renameConversation(
            @PathVariable String conversationId,
            @Valid @RequestBody RenameConversationRequest request) {

        return conversationService.renameConversation(conversationId, request)
                .map(ResponseEntity::ok)
                .onErrorResume(DifyApiException.class, ex ->
                        Mono.just(ResponseEntity.status(ex.getStatusCode()).build()));
    }

    /**
     * 获取对话变量
     * 从特定对话中检索变量。此端点对于提取对话过程中捕获的结构化数据非常有用。
     * @param conversationId 要从中检索变量的对话ID
     * @param lastId 当前页最后面一条记录的ID（可选）
     * @param limit 一次请求返回多少条记录（可选，默认20，最大100，最小1）
     * @param variableName 变量名称（可选，用于过滤特定变量）
     * @return 对话变量列表响应
     */
    @GetMapping("/{conversationId}/variables")
    public Mono<ResponseEntity<CommonResponse<ConversationVariableListResponse>>> getConversationVariables(
            @PathVariable String conversationId,
            @RequestParam @NotEmpty(message = "用户标识不能为空") String userId,
            @RequestParam(required = false) String lastId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String variableName) {
        
        return conversationService.getConversationVariables(conversationId, userId, lastId, limit, variableName)
                .map(data -> ResponseEntity.ok(CommonResponse.success("获取对话变量成功！", data)))
                .onErrorResume(DifyApiException.class, ex ->
                        Mono.just(ResponseEntity.status(ex.getStatusCode())
                                .body(CommonResponse.error(ex.getStatusCode().value(), ex.getMessage()))));
    }
}
