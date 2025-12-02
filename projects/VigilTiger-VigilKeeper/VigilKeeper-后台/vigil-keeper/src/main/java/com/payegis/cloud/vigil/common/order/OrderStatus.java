package com.payegis.cloud.vigil.common.order;

import lombok.Getter;

@Getter
public enum OrderStatus {
    UN_PAY(0, "未支付"),
    PAY_SUCCESS(1, "已支付"),
    CANCEL(2, "交易取消"),
    DELETED(5, "取消后的订单-订单删除"),
    OFFLINE(6, "线下下单审核");
    private Integer code;
    private String name;

    OrderStatus(Integer code, String name){
        this.code=code;
        this.name=name;
    }


}
