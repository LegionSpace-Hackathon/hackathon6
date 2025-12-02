package com.payegis.cloud.vigil.vo;

import lombok.Data;

@Data
public class FileVo {
   private String id;
    private String name;
    private Long size;
    private String extension;
    private String mimeType;
    private String createdBy;
    private Long createdAt;
}
