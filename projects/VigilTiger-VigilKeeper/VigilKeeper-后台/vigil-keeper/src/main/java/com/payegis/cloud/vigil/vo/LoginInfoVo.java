package com.payegis.cloud.vigil.vo;

import lombok.Data;

@Data
public class LoginInfoVo {
    public String username;
    public String mobile;
    public String oldPassword;
    public String password;
    public String code;
    public String token;
    public String source = "pc";
}
