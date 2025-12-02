package com.example.difyproxy.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 文件上传结果类
 */
public class UploadResult {
    
    /**
     * 文件ID
     */
    @JsonProperty("id")
    private String id;
    
    /**
     * 文件名
     */
    @JsonProperty("name")
    private String name;
    
    /**
     * 文件大小
     */
    @JsonProperty("size")
    private Long size;
    
    /**
     * 文件类型
     */
    @JsonProperty("type")
    private String type;
    
    /**
     * 文件扩展名
     */
    @JsonProperty("extension")
    private String extension;
    
    /**
     * 文件MIME类型
     */
    @JsonProperty("mime_type")
    private String mimeType;
    
    /**
     * 创建时间
     */
    @JsonProperty("created_by")
    private String createdBy;
    
    /**
     * 创建时间戳
     */
    @JsonProperty("created_at")
    private Long createdAt;
    
    /**
     * 预览URL
     */
    @JsonProperty("preview_url")
    private String previewUrl;
    
    /**
     * 源文件URL
     */
    @JsonProperty("source_url")
    private String sourceUrl;
    
    public UploadResult() {}
    
    public UploadResult(String id, String name, Long size, String type, String extension, String mimeType, String createdBy, Long createdAt, String previewUrl, String sourceUrl) {
        this.id = id;
        this.name = name;
        this.size = size;
        this.type = type;
        this.extension = extension;
        this.mimeType = mimeType;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.previewUrl = previewUrl;
        this.sourceUrl = sourceUrl;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Long getSize() {
        return size;
    }
    
    public void setSize(Long size) {
        this.size = size;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getExtension() {
        return extension;
    }
    
    public void setExtension(String extension) {
        this.extension = extension;
    }
    
    public String getMimeType() {
        return mimeType;
    }
    
    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public Long getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getPreviewUrl() {
        return previewUrl;
    }
    
    public void setPreviewUrl(String previewUrl) {
        this.previewUrl = previewUrl;
    }
    
    public String getSourceUrl() {
        return sourceUrl;
    }
    
    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }
    
    @Override
    public String toString() {
        return "UploadResult{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", size=" + size +
                ", type='" + type + '\'' +
                ", extension='" + extension + '\'' +
                ", mimeType='" + mimeType + '\'' +
                ", createdBy='" + createdBy + '\'' +
                ", createdAt=" + createdAt +
                ", previewUrl='" + previewUrl + '\'' +
                ", sourceUrl='" + sourceUrl + '\'' +
                '}';
    }
}
