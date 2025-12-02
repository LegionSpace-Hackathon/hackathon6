package com.example.difyproxy.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.util.JSONPObject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private String id;
    private String name;
    private Map<String, Object> inputs;
    private String status;
    @JsonProperty("created_at")
    private Long createdAt;
    @JsonProperty("updated_at")
    private Long updatedAt;

}
