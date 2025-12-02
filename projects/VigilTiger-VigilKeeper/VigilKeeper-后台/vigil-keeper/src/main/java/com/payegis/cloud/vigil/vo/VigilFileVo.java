package com.payegis.cloud.vigil.vo;

import lombok.Data;

import java.util.Date;

@Data
public class VigilFileVo extends PageInfoVo{
    private String fileId;

    private String fileName;

    private String filePath;

    private String fileType;

    private Long fileSize;

    private Integer matchCount;

    private Boolean status;

    private Date uploadTime;

    private Date updateTime;

    private String userId;

    private String orgId;

    private String knowledgeType;

    private String chainFileId;

}