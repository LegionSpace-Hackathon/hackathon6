package com.example.difyproxy.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageListResponse {
    private List<MessageResponse> data;
    @JsonProperty("has_more")
    private Boolean hasMore;
    private Integer limit;

}

