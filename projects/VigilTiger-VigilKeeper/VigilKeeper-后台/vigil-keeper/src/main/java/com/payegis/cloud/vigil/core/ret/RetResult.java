package com.payegis.cloud.vigil.core.ret;

import lombok.Data;

/**
 * @Description: 返回对象实体
 * @author jjr
 * @date 2018/11/14 09:43
 */
@Data
public class RetResult<T> {
    /**
     * 状态码
     */
    public int code;

    /**
     * 提示信息
     */
    private String msg;

    /**
     * 返回的数据
     */
    private T data;

    public RetResult(){}

    public RetResult(T data) {
        this.data = data;
    }

    public RetResult(RetCode retCode) {
        this.code = retCode.getCode();
        this.msg = retCode.getMsg();
    }

    public RetResult(Integer code ,String msg) {
        this.code = code;
        this.msg = msg;
    }

    public RetResult(Integer code ,String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    @Override
    public String toString() {
        return "RetResult{" +
                "code=" + code +
                ", msg='" + msg + '\'' +
                ", data=" + data +
                '}';
    }
}
