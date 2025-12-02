package com.example.difyproxy.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String id;
    @JsonProperty("conversation_id")
    private String conversationId;
    @JsonProperty("parent_message_id")
    private String parentMessageId;
    private String query;
    private String answer;
    private Map<String, Object> inputs;
    @JsonProperty("message_files")
    private List messageFiles;
    private String status;
    @JsonProperty("created_at")
    private Long createdAt;
    private Feedback feedback;
    @JsonProperty("retriever_resources")
    private List<RetrieverResource> retrieverResources;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Feedback {
        private String rating;
        private String comment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RetrieverResource {
        private int position;
        @JsonProperty("dataset_id")
        private String datasetId;
        @JsonProperty("dataset_name")
        private String datasetName;
        @JsonProperty("document_id")
        private String documentId;
        @JsonProperty("document_name")
        private String documentName;
        @JsonProperty("data_source_type")
        private String dataSourceType;
        @JsonProperty("segment_id")
        private String segmentId;
        @JsonProperty("retriever_from")
        private String retrieverFrom;
        private double score;
        @JsonProperty("hit_count")
        private Long hitCount;
        @JsonProperty("word_count")
        private Long wordCount;
        @JsonProperty("segment_position")
        private int segmentPosition;
        @JsonProperty("index_node_hash")
        private String indexNodeHash;
        private String content;
    }
}
