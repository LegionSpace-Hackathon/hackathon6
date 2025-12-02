package com.payegis.cloud.vigil.entity;

import lombok.Data;

@Data
public class User {
    private String userId;

    private String email;

    private String mobile;

    private String pwd;

    private Boolean status;

    private String createTime;

    private String updateTime;

    private String nickName;

    private int source;

    private String chainUserId;

}