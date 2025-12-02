package com.payegis.cloud.vigil.common.order;

import lombok.Getter;

@Getter
public enum PayOrderStatus {
    PAY_FAIL(-1, "支付失败"),
    UN_PAY(0, "未支付"),
    PAY_SUCCESS(1, "支付成功"),
    CLOSE(2, "超时关闭/交易取消"),
    IN_CONFIRM(3, "支付确认中"),
    IN_CHECKING(4,"支付审核中");

    private Integer code;
    private String name;

    PayOrderStatus(Integer code, String name){
        this.code=code;
        this.name=name;
    }


}
