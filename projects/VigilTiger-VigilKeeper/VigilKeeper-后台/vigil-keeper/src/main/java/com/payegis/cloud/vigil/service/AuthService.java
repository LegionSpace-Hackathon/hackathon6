package com.payegis.cloud.vigil.service;

import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.common.CommonConstant;
import com.payegis.cloud.vigil.entity.User;
import com.payegis.cloud.vigil.utils.Base64Img;
import com.payegis.cloud.vigil.utils.DateUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Slf4j
@Service
public class AuthService {

    @Resource
    private UserService userService;
    @Resource
    private ChainApiService chainApiService;

    public User loginByMobile(String mobile){
        try {
            return getOrRegister(mobile,null,mobile, CommonConstant.CustomerSource.MOBILE_CODE);

        } catch (Exception e) {
            log.error("loginByMobile error",e);
        }
        return null;
    }

    public User getOrRegister(String mobile, int source) {
        return getOrRegister(mobile,null,null,source);
    }

    public User getOrRegister(String mobile, String email, String nickName,int source) {
        User user = null;
        if(StringUtils.isNotBlank(mobile)) {
            user = userService.queryUserByMobile(mobile);
        }
        if(user == null && StringUtils.isNotBlank(email)) {
            user = userService.queryUserByEmail(email);
        }
        if(user == null) {
            user = userService.save(mobile,email,nickName,source);
        }

        return user;
    }

    /**
     * 链上会token校检并返回登录用户
     * @param token 链上会token
     * @return
     */
    public User chainMeetValidToken(String token, int customerSource){
        JSONObject dataJson = chainApiService.validTokenV1(token);
        if(dataJson == null) {
            return null;
        }
        String mobile = dataJson.getString("mobile");
        String email = dataJson.getString("email");
        String nickName = dataJson.getString("nickName");
        if(StringUtils.isBlank(mobile) && StringUtils.isBlank(email)){
            log.error("链上会校检返回号码为空");
            return null;
        }
        log.info("chainMeetValidToken data:{}",dataJson);
        try {
            User user = getOrRegister(mobile,email,nickName,customerSource);
            user.setChainUserId(dataJson.getString("userId"));
            try {
                updateAccountAdd(user.getUserId(), dataJson.getString("portraitUrl"));
            }catch (Exception e) {
                log.error("",e);
            }
            return user;

        } catch (Exception e) {
            log.error("链上会议token校验异常",e);
        }
        return null;
    }

    public void updateAccountAdd(String userId,String headUrl) {
        if(StringUtils.isBlank(headUrl)){
            return;
        }
        userService.updateHead(userId,Base64Img.GetBytesStrFromUrl(headUrl));
    }

}
