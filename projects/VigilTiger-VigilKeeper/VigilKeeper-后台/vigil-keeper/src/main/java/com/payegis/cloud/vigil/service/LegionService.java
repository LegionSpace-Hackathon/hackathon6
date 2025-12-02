package com.payegis.cloud.vigil.service;

import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.utils.ThreadUtil;
import com.payegis.cloud.vigil.utils.WSUtil;
import com.sun.jersey.api.client.ClientResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class LegionService {

    private static final String REGEX_COMMA = ",";
    @Value("${legion.msg.url}")
    private String msgUrl;
    @Value("${legion.msg.from}")
    private String msgFrom;
    @Value("${legion.msg.fromCloud}")
    private String msgFromCloud;


    /**
     * 推送公众号-文本消息
     */
    public void sendOfficialTxtMsg(String mobile,String title,String content) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("target",mobile);
        paraJson.put("title",title);
        paraJson.put("content",content);
        ThreadUtil.start(()->{
            post("/admin/chainmeet/im/sendOfficialMsg", paraJson);
        });

    }

    /**
     * 推送公众号-链接消息--循环
     */
    public void sendOfficialLinkMsg(List<String> mobiles, String urlAddress, String title, String content, String urlImage) {
        if(mobiles == null || mobiles.isEmpty()) {
            return;
        }
        ThreadUtil.start(()->{
            Set<String> set = new HashSet<>(mobiles);
            for(String mobile : set) {
                try {
                    sendOfficialLinkMsg(mobile,urlAddress,title,content,urlImage);
                    Thread.sleep(2000);
                } catch (Exception e) {
                    log.error("sendChainLinkMsg error",e);
                }
            }
        });
    }

    /**
     * 推送公众号-链接消息
     */
    public void sendOfficialLinkMsg(String mobile,String urlAddress,String title,String content,String urlImage) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("target",mobile);
        paraJson.put("urlTitle",title);
        paraJson.put("urlAddress",urlAddress);
        paraJson.put("urlContent",content);
        paraJson.put("urlImage",urlImage);
        String from = urlAddress.contains("ChatGPT_Chain")?msgFromCloud:msgFrom;//gpt晨问用数信云账号发送
        paraJson.put("from",from);
        log.info("sendOfficialLinkMsg urlTitle:{} target:{}",title, mobile);
        post("/admin/chainmeet/im/sendOfficialLinkMsg", paraJson);
    }

    /**
     * 推送群-链接消息--循环
     */
    public void sendMoreGroupLinkMsg(String urlAddress,String title,String content,String urlImage,String targetId) {
        if(StringUtils.isBlank(targetId)) {
            return;
        }
        String from = urlAddress.contains("ChatGPT_Chain")?msgFromCloud:msgFrom;//gpt晨问用数信云账号发送
        String[] targetIds = targetId.split(REGEX_COMMA);
        for (String tmpId : targetIds) {
            JSONObject requestJson = new JSONObject();
            requestJson.put("urlTitle",title);
            requestJson.put("urlAddress",urlAddress);
            requestJson.put("urlContent",content);
            requestJson.put("urlImage",urlImage);
            requestJson.put("from",from);

            sendGroupLinkMsg(tmpId,requestJson);
        }
    }

    /**
     * 推送群-链接消息
     */
    private void sendGroupLinkMsg(String targetId,JSONObject requestJson) {
        if(StringUtils.isBlank(targetId)) {
            return;
        }
        JSONObject paraJson = new JSONObject();
        paraJson.put("targetGroupId", targetId);
        paraJson.put("urlTitle",requestJson.getString("urlTitle"));
        paraJson.put("urlAddress",requestJson.getString("urlAddress"));
        paraJson.put("urlContent",requestJson.getString("urlContent"));
        paraJson.put("urlImage",requestJson.getString("urlImage"));
        paraJson.put("from",requestJson.getString("from"));
        ThreadUtil.start(()-> {
            post("/admin/chainmeet/im/sendOfficialLinkMsg/group", paraJson);
        });
    }

    /**
     * 推送多个群-文本消息--循环
     */
    public void sendMoreGroupTxtMsg(JSONObject requestJson,String targetId) {
        if(StringUtils.isBlank(targetId)) {
            return;
        }
        String[] targetIds = targetId.split(REGEX_COMMA);
        for (String tmpId : targetIds) {
            sendGroupTxtMsg(requestJson, tmpId);
        }
    }

    /**
     * 推送群-文本消息
     */
    private void sendGroupTxtMsg(JSONObject requestJson,String targetId) {
        if(StringUtils.isBlank(targetId)) {
            return;
        }

        JSONObject paraJson = new JSONObject();
        paraJson.put("targetGroupId", targetId);
        paraJson.put("title",requestJson.getString("title"));
        paraJson.put("content",requestJson.getString("content"));
        if(StringUtils.isNotBlank(requestJson.getString("titleEn"))) {
            paraJson.put("titleEn", requestJson.getString("titleEn"));
            paraJson.put("contentEn", requestJson.getString("contentEn"));
        }else {
            paraJson.put("titleEn", requestJson.getString("title"));
            paraJson.put("contentEn", requestJson.getString("content"));
        }

        ThreadUtil.start(()-> {
            post("/admin/chainmeet/im/sendOfficialMsg/group", paraJson);
        });
    }

    private void post(String urlSuffix,JSONObject paraJson) {
        try {
            String from = paraJson.getString("from");
            paraJson.put("from",StringUtils.isBlank(from)?msgFrom:from);
            paraJson.put("type",0);
            ClientResponse response = WSUtil.sendRequestPostJson(msgUrl + urlSuffix, paraJson);
            String result = response.getEntity(String.class);
            log.info("post legion,url:{} result:{}",urlSuffix, result);
        } catch (Exception e) {
            log.error("post legion error,url:{}", urlSuffix,e);
        }
    }
}
