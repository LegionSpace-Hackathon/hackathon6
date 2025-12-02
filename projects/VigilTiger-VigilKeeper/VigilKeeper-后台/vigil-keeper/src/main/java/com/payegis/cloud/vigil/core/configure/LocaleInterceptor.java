package com.payegis.cloud.vigil.core.configure;

import org.apache.commons.lang3.StringUtils;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Locale;

public class LocaleInterceptor extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        // 根据请求头判断语言
        String language = request.getHeader("language");
        language = StringUtils.isBlank(language) ? request.getParameter("language") : language;
        language = StringUtils.isBlank(language) ? "zh_CN" : language;

        Locale locale = null;
        if(language.contains("_")) {
            String[] split = language.split("_");
            locale = new Locale(split[0],split[1]);
        }else if(language.contains("-")) {
            locale = Locale.forLanguageTag(language);
        }
        // 线程安全的，底层是用ThreadLocal来存储的。
        // 设置地区。
        LocaleContextHolder.setLocale(locale);
        return true;
    }
}
