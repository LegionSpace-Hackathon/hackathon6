package com.payegis.cloud.vigil.core.ret;

/**
 * @Description: 将结果转换为封装后的对象
 * @author jjr
 * @date 2018/11/14 11:45
 */
public class RetResponse {

    public static <T> RetResult<T> makeOKRsp(Object data){
        return new RetResult(RetCode.SUCCESS.getCode(),RetCode.SUCCESS.getMsg(),data);
    }

    public static <T> RetResult<T> makeOKRsp(){
        return makeOKRsp(null);
    }

    public static <T> RetResult<T> error(Integer code,String msg){
        return new RetResult<T>(code,msg);
    }

    public static <T> RetResult<T> makeErrRsp() {
        return new RetResult<T>(RetCode.FAIL);
    }

    public static <T> RetResult<T> makeErrRsp(String msg) {
        return new RetResult<T>(RetCode.FAIL.code,msg);
    }

    public static <T> RetResult<T> makeRsp(int code, String msg) {
        return new RetResult<T>(code,msg);
    }

    public static <T> RetResult<T> makeRsp(int code, String msg, T data) {
        return new RetResult<T>(code,msg,data);
    }
}

