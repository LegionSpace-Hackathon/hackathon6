package com.payegis.cloud.vigil.common.order;


import lombok.Getter;

/**
 * @author hongli.zhang
 * @create date 2020/7/13
 * 币种
 */

@Getter
public enum AliTradeStatusEnum {
    WAIT_BUYER_PAY("WAIT_BUYER_PAY","交易创建，等待买家付款"),
    TRADE_CLOSED("TRADE_CLOSED","未付款交易超时关闭，或支付完成后全额退款"),
    TRADE_SUCCESS("TRADE_SUCCESS","交易支付成功"),
    TRADE_FINISHED("TRADE_FINISHED","交易结束，不可退款");
    private String name;
    private String code;
    AliTradeStatusEnum(String code, String name){
        this.code = code;
        this.name= name;
    }
}
