package com.payegis.cloud.vigil.common.exception;

import lombok.Getter;

@Getter
public enum ExceptionErrorEnum {
    APK_SIZE_ERR(-402,"文件大小超出限制 (2GB)"),
    APK_SHIELDED(-403,"apk已加固"),
    ERR_RECORD_NOT_FOUND(-404,"APP不存在，加固失败"),
    DOWN_ERROR(-405,"下载异常"),
    PARSE_ERROR(-406,"解析异常"),
    PURCHASED_ERROR(-407,"未购买"),
    TIMES_ERROR(-408,"次数已用完"),
    NET_ERROR(-409,"网络繁忙，稍后再试"),
    FILE_FORMAT_ERROR(-410,"文件格式错误");
    public Integer code;
    public String msg;

    ExceptionErrorEnum(Integer code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
