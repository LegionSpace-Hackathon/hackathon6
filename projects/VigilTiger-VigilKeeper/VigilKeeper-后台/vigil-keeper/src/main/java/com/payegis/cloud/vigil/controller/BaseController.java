package com.payegis.cloud.vigil.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.github.pagehelper.PageInfo;
import com.payegis.cloud.vigil.common.I18nConstant;
import com.payegis.cloud.vigil.core.configure.SensitiveWord;
import com.payegis.cloud.vigil.exception.ApplicationException;
import com.payegis.cloud.vigil.service.UserService;
import com.payegis.cloud.vigil.service.i18n.MsgSourceService;
import com.payegis.cloud.vigil.utils.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.Date;

import static com.payegis.cloud.vigil.common.CacheConstant.REDIS_KEY_PRE;
import static com.payegis.cloud.vigil.common.CommonConstant.*;

@Component
@Slf4j
public class BaseController {
    @Resource
    private MsgSourceService msgSourceService;
    @Resource
    private UserService userService;
    @Resource
    private RedisUtil redisUtil;
    @Resource
    private SensitiveWord sensitiveWord;

    protected String msg(String code) {
        return msgSourceService.getMsg(code);
    }

    protected String msg(String code, Object obj) {
        return msgSourceService.getMsg(code,obj);
    }

    protected String getUserIdByAttr(HttpServletRequest request){
        String userId = request.getAttribute(USER_ID).toString();
        handleLoginLog(userId,request);
        return userId;
    }

    protected String getUserId(HttpServletRequest request){
        String userId = getUserIdByHead(request);
        log.info("getUserId:{}",userId);
        if(StringUtils.isNotBlank(userId)) {
            return userId;
        }
        String frontTempUser = request.getHeader(TMP_USER);
        log.info("frontTempUser:{}",frontTempUser);
        if(StringUtils.isNotBlank(frontTempUser)) {
            return frontTempUser;
        }
        return "18181818";
    }

    protected String getUserIdByHead(HttpServletRequest request){
        String token = request.getHeader(TOKEN);
        log.info("getUserIdByHead token:{}",token);
        if(StringUtils.isBlank(token) || NULL_STR.equalsIgnoreCase(token)){
            return null;
        }
        String tokenData = DESUtil.decrypt2(token);
        log.info("getUserIdByHead decrypt token:{}",tokenData);
        String[] data = StringUtils.split(tokenData,SEP_BLANK);
        if(data==null || data.length!=3) {
            return null;
        }
        String userId = data[0];

        //handleLoginLog(userId,request);
        return userId;

    }

    protected String checkUserToken(HttpServletRequest request){
        String token = request.getHeader(TOKEN);
        log.info("checkUserToken token:{}",token);
        if(StringUtils.isBlank(token) || NULL_STR.equalsIgnoreCase(token)){
            return null;
        }
        String tokenData = DESUtil.decrypt2(token);
        log.info("checkUserToken decrypt token:{}",tokenData);
        String[] data = StringUtils.split(tokenData,SEP_BLANK);
        if(data==null || data.length!=3) {
            return null;
        }
        String userId = data[0];
        String clientToken = data[1];
        String source = data[2];
        Object cacheToken = redisUtil.getToken(REDIS_KEY_PRE+userId+"-"+source);
        if(clientToken.equals(cacheToken)) {
            return userId;
        }

        return null;
    }

    protected String getUserIdFromShare(HttpServletRequest request){
        String token = request.getHeader(SHARE_TOKEN);
        if(StringUtils.isBlank(token) || NULL_STR.equalsIgnoreCase(token)){
            return null;
        }
        String tokenData = DESUtil.decrypt2(token);
        String[] data = StringUtils.split(tokenData,SEP_BLANK);
        if(data==null || data.length!=3) {
            return null;
        }
        return data[0];
    }

    protected String getLanguage(HttpServletRequest request){
        String language = request.getHeader("language");
        language = StringUtils.isBlank(language) ? request.getParameter("language") : language;
        language = StringUtils.isBlank(language) ? "zh" : language;
        language = StringUtils.substringBefore(language,"_");
        language = StringUtils.substringBefore(language,"-");
        return language;
    }

    protected boolean isEn(HttpServletRequest request) {
        return "en".equals(getLanguage(request));
    }

    protected JSONObject decryptByPublicKey(String base64, String publicKey) throws Exception {
        String decodeData = RSAUtil.decryptByPublicKey(base64,publicKey);
        return JSON.parseObject(decodeData);
    }

    private void handleLoginLog(String userId, HttpServletRequest request) {
        String redisKey = REDIS_KEY_PRE+"Login-Time-"+userId+"-"+ DateUtil.getDate();
        log.info("handleLoginLog key:{}",redisKey);
        if(redisUtil.exist(redisKey)) {
            return;
        }
        ThreadUtil.start(() -> {
            log.info("handleLoginLog val:{}",redisUtil.getValue(redisKey));
            userService.saveLoginLog(userId);
            redisUtil.putValue(redisKey,"1",24*60);
        });

    }


}
