package com.example.difyproxy.common;

/**
 * 通用返回结果类
 * @param <T> 数据类型
 */
public class CommonResponse<T> {
    
    /**
     * 状态码，200表示成功，500表示失败
     */
    private Integer code;
    
    /**
     * 返回消息
     */
    private String message;
    
    /**
     * 返回数据
     */
    private T data;
    
    public CommonResponse() {}
    
    public CommonResponse(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    /**
     * 成功返回
     */
    public static <T> CommonResponse<T> success(T data) {
        return new CommonResponse<>(200, "操作成功", data);
    }
    
    /**
     * 成功返回，自定义消息
     */
    public static <T> CommonResponse<T> success(String message, T data) {
        return new CommonResponse<>(200, message, data);
    }
    
    /**
     * 失败返回
     */
    public static <T> CommonResponse<T> error(String message) {
        return new CommonResponse<>(500, message, null);
    }
    
    /**
     * 失败返回，自定义状态码
     */
    public static <T> CommonResponse<T> error(Integer code, String message) {
        return new CommonResponse<>(code, message, null);
    }
    
    public Integer getCode() {
        return code;
    }
    
    public void setCode(Integer code) {
        this.code = code;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    @Override
    public String toString() {
        return "CommonResponse{" +
                "code=" + code +
                ", message='" + message + '\'' +
                ", data=" + data +
                '}';
    }
}
