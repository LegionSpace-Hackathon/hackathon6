package com.example.difyproxy.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 对话变量响应类
 * @author hongli.zhang
 * @create date 2025/1/15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationVariableResponse {
    /**
     * 变量ID
     */
    private String id;
    
    /**
     * 变量名称
     */
    private String name;
    
    /**
     * 变量类型（字符串、数字、布尔等）
     */
    @JsonProperty("value_type")
    private String valueType;
    
    /**
     * 变量值
     */
    private String value;
    
    /**
     * 变量描述
     */
    private String description;
    
    /**
     * 创建时间戳
     */
    @JsonProperty("created_at")
    private Long createdAt;
    
    /**
     * 最后更新时间戳
     */
    @JsonProperty("updated_at")
    private Long updatedAt;
}

