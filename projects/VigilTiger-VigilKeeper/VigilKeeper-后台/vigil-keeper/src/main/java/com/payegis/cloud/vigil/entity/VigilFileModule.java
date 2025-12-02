package com.payegis.cloud.vigil.entity;

import lombok.Data;

import java.util.Date;

@Data
public class VigilFileModule {
    private Long id;

    private String moduleName;

    private Date createTime;

    private Date updateTime;

    private String userId;

}