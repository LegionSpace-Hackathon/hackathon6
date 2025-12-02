package com.payegis.cloud.vigil.core.configure;

import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.common.I18nConstant;
import com.payegis.cloud.vigil.core.ret.RetCode;
import com.payegis.cloud.vigil.service.i18n.MsgSourceService;
import com.payegis.cloud.vigil.utils.DESUtil;
import com.payegis.cloud.vigil.utils.RedisUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static com.payegis.cloud.vigil.common.CacheConstant.REDIS_KEY_PRE;
import static com.payegis.cloud.vigil.common.CommonConstant.*;

@Slf4j
public class LoginInterceptor implements HandlerInterceptor {

    @Resource
    private RedisUtil redisUtil;
    @Resource
    private MsgSourceService msgSourceService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader(TOKEN);
        log.info("LoginInterceptor source token:{}",token);
        try {
            if(StringUtils.isBlank(token) || NULL_STR.equalsIgnoreCase(token)){
                noAuth(response,RetCode.LOGIN_TIME_OUT.code,msgSourceService.getMsg(I18nConstant.LOGIN_INVALID));
                return false;
            }
            String tokenData = DESUtil.decrypt2(token);
            log.info("LoginInterceptor decrypt token:{}",tokenData);
            String[] data = StringUtils.split(tokenData,SEP_BLANK);
            if(data==null || data.length!=3) {
                noAuth(response,RetCode.LOGIN_TIME_OUT.code,msgSourceService.getMsg(I18nConstant.LOGIN_INVALID));
                return false;
            }
            String userId = data[0];
            String clientToken = data[1];
            String source = data[2];
            Object cacheToken = redisUtil.getToken(REDIS_KEY_PRE+userId+"-"+source);
            log.info("LoginInterceptor cache token:{}",cacheToken);
            if(clientToken.equals(cacheToken)){
                request.setAttribute(USER_ID,userId);
                return true;
            }else {
                noAuth(response,RetCode.LOGIN_TIME_OUT.code,msgSourceService.getMsg(I18nConstant.LOGIN_INVALID));
                return false;
            }
        } catch (Exception e) {
            log.error("LoginInterceptor error token:{}", token,e);
            try {
                noAuth(response,RetCode.LOGIN_TIME_OUT.code,msgSourceService.getMsg(I18nConstant.LOGIN_INVALID));
            } catch (IOException ex) {
                log.error("LoginInterceptor error token:{}", token,ex);
            }
        }
        return false;
    }

    private void noAuth(HttpServletResponse response, int code, String msg) throws IOException {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("code", code);
        jsonObject.put("msg", msg);
        log.info("LoginInterceptor noAuth response:{}",jsonObject);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().println(jsonObject);
    }
}
