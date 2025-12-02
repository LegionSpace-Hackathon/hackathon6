package com.payegis.cloud.vigil.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ChatMessageDto {
    @JsonProperty("inputs")
    private Object inputs;

    @JsonProperty("query")
    private String query;

    @JsonProperty("response_mode")
    private String responseMode;

    @JsonProperty("conversation_id")
    private String conversationId;

    @JsonProperty("user")
    private String user;

    @JsonProperty("files")
    private Object files;

}
