package com.payegis.cloud.vigil.service.i18n;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

@Component
public class MsgSourceService {
    // 注入成员变量
    @Autowired
    private MessageSource messageSource;

    public String getMsg(String code, Object... args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }

}
