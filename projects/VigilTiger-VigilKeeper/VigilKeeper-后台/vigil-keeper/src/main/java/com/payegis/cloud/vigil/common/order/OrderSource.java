package com.payegis.cloud.vigil.common.order;

import lombok.Getter;

@Getter
public enum OrderSource {
    PC(1, "PC"),
    H5(2, "H5"),
    DAPP(3, "链上会"),
    WXMINI(4, "微信小程序");
    private Integer code;
    private String name;

    OrderSource(Integer code, String name){
        this.code=code;
        this.name=name;
    }

    public static Integer getCode(String name) {
        for(OrderSource orderSource : OrderSource.values()) {
            if(orderSource.getName().equals(name)) {
                return orderSource.getCode();
            }
        }
        return null;
    }


}
