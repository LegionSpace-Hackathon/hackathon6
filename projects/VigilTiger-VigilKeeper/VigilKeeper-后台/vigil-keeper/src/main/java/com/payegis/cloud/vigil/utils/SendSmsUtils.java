package com.payegis.cloud.vigil.utils;

import com.alibaba.fastjson.JSONObject;
import com.aliyuncs.CommonRequest;
import com.aliyuncs.CommonResponse;
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.http.MethodType;
import com.aliyuncs.profile.DefaultProfile;
import io.netty.util.internal.ObjectUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.util.Objects;

/**
 * @Author: dht
 */

@Slf4j
@Component
public class SendSmsUtils {

    //@Autowired
    //private RedisTemplate<String, Object> redisTemplate;

    public static final String CHINA_AREA_CODE = "86";


    /**
     * 发送手机短信
     * @param mobile 要发送的手机号
     * @param templateParam 模板中的参数
     * @param signName 发件人名称，如【通付盾】尊敬的用户您好......
     * @param templateCode  模板代码，如 SMS_206560801
     */
    public void sendMsgInternal(String mobile, JSONObject templateParam, String signName, String templateCode) {


        DefaultProfile profile = DefaultProfile.getProfile("cn-hangzhou", "", "");
        IAcsClient client = new DefaultAcsClient(profile);

        CommonRequest request = new CommonRequest();
        request.setSysMethod(MethodType.POST);
        request.setSysDomain("dysmsapi.aliyuncs.com");
        request.setSysAction("SendSms");
        request.putQueryParameter("PhoneNumbers", mobile);
        request.putQueryParameter("SignName", signName);
        request.setSysVersion("2017-05-25");
        request.putQueryParameter("RegionId", "cn-hangzhou");
        request.putQueryParameter("TemplateCode", templateCode);
        request.putQueryParameter("TemplateParam", templateParam.toJSONString());
        try {
            CommonResponse response = client.getCommonResponse(request);
            log.info("code:{},to {},sms send result:{}", templateCode, mobile, response.getData());
        } catch (ClientException e) {
            log.error("",e);
        }
    }


    public void checkSendMsgSafe(String mobile) {
        HttpServletRequest request = ((ServletRequestAttributes) Objects.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
        String ip = getIpAddress(request);

        log.info("发送短信安全检查：ip={},mobile={}",ip,mobile);
        //同一个手机号一分钟内不允许发送多次
        String minKey = String.format("sendMsg:mobile:minute:%s", mobile);
        Integer count = (Integer) ObjectUtil.intValue(45,0);//redisTemplate.opsForValue().get(minKey), 0);
        if (count > 0) {
            log.info("同一个手机号一分钟内不允许发送多次：{}", mobile);
            throw new RuntimeException("同一个手机号一分钟内不允许发送多次");
        } else {
            //redisTemplate.opsForValue().increment(minKey);
            //redisTemplate.expire(minKey, 1, TimeUnit.MINUTES);
        }

        //同一个手机号一天内不允许发送超过15次
        String mobileKeyDay = String.format("sendMsg:mobile:day:%s", mobile);
        Integer count4 = 0;//(Integer) ObjectUtil.defaultIfNull(redisTemplate.opsForValue().get(mobileKeyDay), 0);
        if (count4 > 15) {
            log.info("同一个手机号一天内不允许发送超过15次：{}", mobile);
            throw new RuntimeException("同一个手机号一天内不允许发送超过15次");
        } else {
           // redisTemplate.opsForValue().increment(mobileKeyDay);
           // redisTemplate.expireAt(mobileKeyDay, DateUtil.endOfDay(new Date()));
        }


        //同一个ip一分钟内不允许发送超过50次
        String ipKey = String.format("sendMsg:ip:minute:%s", ip);
        Integer count2 = 0;//(Integer) ObjectUtil.defaultIfNull(redisTemplate.opsForValue().get(ipKey), 0);
        if (count2 > 50) {
            log.info("同一个ip一分钟内不允许发送超过50次：{}", ip);
            throw new RuntimeException("同一个ip一分钟内不允许发送超过50次");
        } else {
            //redisTemplate.opsForValue().increment(ipKey);
            if (count2 == 0) {
                //redisTemplate.expire(ipKey, 1, TimeUnit.MINUTES);
            }
        }

        //同一个ip一天内不允许发送超过500次
        String ipKeyDay = String.format("sendMsg:ip:day:%s", ip);
        Integer count3 = 0;//(Integer) ObjectUtil.defaultIfNull(redisTemplate.opsForValue().get(ipKeyDay), 0);
        if (count3 > 500) {
            log.info("同一个ip一天内不允许发送超过500次：{}", ip);
            throw new RuntimeException("同一个ip一天内不允许发送超过500次");
        } else {
            //redisTemplate.opsForValue().increment(ipKeyDay);
            //redisTemplate.expireAt(ipKeyDay, DateUtil.endOfDay(new Date()));
        }
    }


    /**
     * 获取ip地址
     *
     * @param request
     * @return
     */
    public String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("x-forwarded-for");
        if (ip == null || ip.length() == 0 || "unknow".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
            if (ip.equals("127.0.0.1")) {
                //根据网卡取本机配置的IP
                InetAddress inet = null;
                try {
                    inet = InetAddress.getLocalHost();
                } catch (Exception e) {
                    e.printStackTrace();
                }
                ip = inet.getHostAddress();
            }
        }
        // 多个代理的情况，第一个IP为客户端真实IP,多个IP按照','分割
        if (ip != null && ip.length() > 15) {
            if (ip.indexOf(",") > 0) {
                ip = ip.substring(0, ip.indexOf(","));
            }
        }
        return ip;
    }

}
