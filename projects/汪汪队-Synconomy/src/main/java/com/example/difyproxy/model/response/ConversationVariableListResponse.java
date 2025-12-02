package com.example.difyproxy.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 对话变量列表响应类
 * @author hongli.zhang
 * @create date 2025/1/15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationVariableListResponse {
    /**
     * 每页项目数
     */
    private Integer limit;
    
    /**
     * 是否有更多项目
     */
    @JsonProperty("has_more")
    private Boolean hasMore;
    
    /**
     * 变量列表
     */
    private List<ConversationVariableResponse> data;
}

