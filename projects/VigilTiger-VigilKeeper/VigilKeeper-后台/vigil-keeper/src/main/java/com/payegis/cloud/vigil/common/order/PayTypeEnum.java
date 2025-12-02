package com.payegis.cloud.vigil.common.order;

import lombok.Getter;

@Getter
public enum PayTypeEnum {
    UNIONPAY(1,"银联支付"),
    ALIPAY(2,"支付宝支付"),
    WXPAY(3,"微信支付"),
    DAPP_POINTS_PAY(4,"DAPP积分支付"),
    PAYPAL_PAY(5,"海外PayPal支付"),
    PAYPAL_CREDIT_PAY(5,"海外PayPal借记卡/信用卡支付"),
    OFFLINE_TRANSFER(6,"线下转账"),
    ALI_H5(7,"支付宝H5支付"),
    DCLOUD(8,"数信云"),
    WXPAY_H5(9,"微信H5支付"),
    WXPAY_MINI(10,"微信小程序支付"),
    ALI_CYCLE(11,"支付宝代扣支付"),
    AGENT(12,"代建");

    private Integer code;
    private String name;

    PayTypeEnum(Integer code, String name){
        this.code = code;
        this.name = name;
    }
}
