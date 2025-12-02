package com.payegis.cloud.vigil.vo;

import lombok.Data;

import java.util.Date;

@Data
public class VigilFileModuleVo{
    private Long id;

    private String moduleName;

    private Date createTime;

    private Date updateTime;

    private String userId;

}