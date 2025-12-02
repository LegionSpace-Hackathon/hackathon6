package com.payegis.cloud.vigil.controller;

import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.common.I18nConstant;
import com.payegis.cloud.vigil.core.ret.RetCode;
import com.payegis.cloud.vigil.core.ret.RetResponse;
import com.payegis.cloud.vigil.core.ret.RetResult;
import com.payegis.cloud.vigil.entity.User;
import com.payegis.cloud.vigil.service.AuthService;
import com.payegis.cloud.vigil.service.ChainApiService;
import com.payegis.cloud.vigil.service.UserService;
import com.payegis.cloud.vigil.utils.CommonStringUtil;
import com.payegis.cloud.vigil.utils.DESUtil;
import com.payegis.cloud.vigil.utils.DateUtil;
import com.payegis.cloud.vigil.utils.RedisUtil;
import com.payegis.cloud.vigil.vo.LoginInfoVo;
import com.tongfudun.damo.sdk.KeyManager;
import com.tongfudun.damo.sdk.model.ResultModel;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.ResourceUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

import static com.payegis.cloud.vigil.common.CacheConstant.REDIS_KEY_PRE;
import static com.payegis.cloud.vigil.common.CommonConstant.*;

@CrossOrigin(origins = "*")
@Slf4j
@RestController
@RequestMapping(value = "/auth")
public class AuthController extends BaseController {

    @Value("${chain.meet.scanLogin.appId}")
    private String appId;
    @Value("${chain.meet.scanLogin.rsaPrivateKey}")
    private String rsaPrivateKey;
    @Value("${chain.meet.scanLogin.signPrivateKey}")
    private String signPrivateKey;
    @Value("${chain.meet.scanLogin.signPublicKey}")
    private String signPublicKey;
    @Value("${chain.meet.scanLogin.authUrl}")
    private String authUrl;
    @Value("${chain.meet.scanLogin.scenId}")
    private String scenId;

    @Autowired
    private UserService userService;
    @Autowired
    private AuthService authService;
    @Autowired
    private RedisUtil redisUtil;
    @Autowired
    private ChainApiService chainApiService;

    @RequestMapping(value = "/login")
    public RetResult login(@RequestBody LoginInfoVo loginVo){
        if(StringUtils.isBlank(loginVo.getMobile())){
            return RetResponse.makeErrRsp("Mobile is none");
        }
        User user = authService.loginByMobile(loginVo.getMobile());
        if(user != null){
            JSONObject data = loginSuccess(user,LoginSource.PC);
            log.info("Login Success: {}",data);
            return RetResponse.makeOKRsp(data);
        }
        return RetResponse.makeRsp(RetCode.UNAUTHORIZED.code,RetCode.UNAUTHORIZED.msg);

    }

    @RequestMapping(value = "/checkToken")
    public RetResult checkToken(HttpServletRequest request){
        String userId = checkUserToken(request);
        if(StringUtils.isBlank(userId)) {
            return RetResponse.makeErrRsp("Token已过期");
        }
        return RetResponse.makeOKRsp(userId);
    }

    /**
     * 获取链上会议appId
     * @return
     */
    @RequestMapping(value = "/ChainMeet/appId")
    public RetResult getAppId(){
        return RetResponse.makeOKRsp(chainApiService.getAppId());
    }

    /**
     * 第三方登录(链上会议携带自身token登录开发者平台)
     * @param loginVo 表单
     * @return
     */
    @RequestMapping(value = "/ChainMeet/login")
    public RetResult chainMeetLogin(@RequestBody LoginInfoVo loginVo){
        if(StringUtils.isBlank(loginVo.getToken())){
            return RetResponse.makeErrRsp("Token can't be none");
        }
        User user = authService.chainMeetValidToken(loginVo.getToken(),CustomerSource.CHAIN_MEET);
        if(user != null){
            JSONObject data = loginSuccess(user,LoginSource.CHAIN_MEET);
            log.info("ChainMeet Login Success: {}",data);
            return RetResponse.makeOKRsp(data);//gu ding LoginSource.CHAIN_MEET
        }
        return RetResponse.makeRsp(RetCode.UNAUTHORIZED.code,RetCode.UNAUTHORIZED.msg);

    }

    @GetMapping(value = "/qrcode/param")
    public RetResult getParams() {
        JSONObject result = new JSONObject();
        result.put("appId", appId);
        result.put("dimensionaCode","dimensionaCode");
        result.put("scenId", scenId);
        result.put("token", CommonStringUtil.getCodeToken());
        return RetResponse.makeRsp(RetCode.CLOUD_SUCCESS.code,RetCode.CLOUD_SUCCESS.msg,result);
    }

    @GetMapping(value = "/qrcode/webCallback")
    public RetResult webCallback(@RequestParam String token) {
        try {
            ResultModel resultModel = KeyManager.authWeb(token,appId, signPublicKey, signPrivateKey, authUrl);
            if (resultModel == null || !"000000".equals(resultModel.getCode())) {
                return RetResponse.makeRsp(-456,msg(I18nConstant.LOGIN_FAIL));
            }
            JSONObject data = JSONObject.parseObject(resultModel.getData());
            JSONObject content = JSONObject.parseObject(data.getString("content"));
            JSONObject mobileJsonObject = content.getJSONObject("msg");
            String mobile = mobileJsonObject.getJSONArray("mobile").get(0).toString();
            if(!CommonStringUtil.isMobileNumber(mobile)){
                return RetResponse.makeRsp(-456,msg(I18nConstant.MOBILE_INVALID));
            }

            User user = authService.getOrRegister(mobile,CustomerSource.CHAIN_MEET_QR);
            if (user != null){
                return RetResponse.makeRsp(RetCode.CLOUD_SUCCESS.code,RetCode.CLOUD_SUCCESS.msg,loginSuccess(user,LoginSource.PC));
            }
        } catch (Exception e) {
            log.error("{} 扫码登录异常{}",DateUtil.getCurrentTime(),e.getMessage());
        }
        return RetResponse.makeRsp(-456,msg(I18nConstant.LOGIN_FAIL));
    }

    @RequestMapping(value = "/getHeader/{userId}")
    public void getHeader(@PathVariable String userId, HttpServletResponse response) {
        response.setContentType("application/octet-stream");
        byte[] headPic = userService.queryHeadImg(userId);
        try (OutputStream out = response.getOutputStream();
             InputStream file = headPic != null ? new ByteArrayInputStream(headPic)
                     : new FileInputStream(ResourceUtils.getFile(USER_DEFAULT_ICON))) {

            int len = 0;
            byte[] buffer = new byte[1024 * 10];
            while ((len = file.read(buffer)) != -1){
                out.write(buffer,0,len);
            }
            out.flush();

        } catch (Exception e) {
            log.error("getHeader error", e);
        }
    }

    private JSONObject loginSuccess(User user, String loginSource){
        String userId = user.getUserId();
        String token = CommonStringUtil.get32UUID();

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("token",DESUtil.encrypt2(userId+SEP_BLANK+token+SEP_BLANK+loginSource));
        jsonObject.put("mobile", user.getMobile());
        jsonObject.put("email", user.getEmail());
        jsonObject.put("nickName", user.getNickName());
        jsonObject.put("userId", userId);

        //redisUtil.putToken(REDIS_KEY_PRE+userId+"-"+loginSource, token);
        return jsonObject;
    }

}
