package com.payegis.cloud.vigil.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.utils.DESUtil;
import com.payegis.cloud.vigil.utils.HuTuUtil;
import com.payegis.cloud.vigil.utils.WSUtil;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.util.MultivaluedMapImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class CloudApiService {

    @Value("${cloud.url}")
    private String cloudUrl;
    @Value("${cloud.activity.url}")
    private String activityUrl;

    public String verify(String token){
        MultivaluedMapImpl jsonObjs = new MultivaluedMapImpl();
        jsonObjs.add("token",token);
        Client client = Client.create();
        WebResource rs = client.resource(cloudUrl+"/api/slider/auth");
        return rs.header("Content-Type","application/x-www-form-urlencoded;charset=UTF-8").post(ClientResponse.class, jsonObjs).getEntity(String.class);
    }

    public JSONObject getInfoOrRegister(String mobile) {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("mobile", mobile);
        String url = cloudUrl + "/api/market/getInfoOrRegister";
        String result = WSUtil.sendRequestPostEncryptData(url, jsonObject).getEntity(String.class);
        log.info("getInfoOrRegister result:{}",result);

        JSONObject entity = JSON.parseObject(result);
        if(entity == null || !"0".equals(entity.getString("code"))){
            return null;
        }
        String data = entity.getString("data");
        if(StringUtils.isBlank(data)){
            return null;
        }

        return JSONObject.parseObject(HuTuUtil.decrypt(data));

    }

    public String login(String mobile,String cloudSecretId) {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("mobile",mobile);
        jsonObject.put("secretId",cloudSecretId);
        String result = WSUtil.sendRequestPostEncryptData(cloudUrl + "/api/market/login", jsonObject).getEntity(String.class);

        JSONObject entity = JSON.parseObject(result);
        if(entity == null || !"0".equals(entity.getString("code"))){
            return null;
        }
        String data = entity.getString("data");
        if(StringUtils.isBlank(data)){
            return null;
        }

        return HuTuUtil.decrypt(data);
    }

    public JSONObject getUserInfo(String cloudSecretId) {
        String url = cloudUrl + "/api/user/userInfoBySecretId?secretId="+ cloudSecretId;
        String result = WSUtil.sendRequestGet(url).getEntity(String.class);

        JSONObject resultJson = JSON.parseObject(result);
        if(resultJson == null || !"0".equals(resultJson.getString("code"))) {
            return null;
        }

        return resultJson.getJSONObject("data");

    }

    private Map<String,Object> getHead() {
        Map<String,Object> headMap = new HashMap<>();
        headMap.put("EA-Timestamp", DESUtil.encrypt(System.currentTimeMillis()));
        return headMap;
    }

    //======================Org=======================//

    public JSONArray listOrg(String mobile,String email) {
        JSONObject paraJson = new JSONObject();
        if(StringUtils.isNotBlank(mobile)) {
            paraJson.put("mobile", mobile);
        }
        if(StringUtils.isNotBlank(email)) {
            paraJson.put("email", email);
        }
//        String url = "http://192.168.208.9:8081/api/external/organization/list";
//        String url = "https://member.tongfudun.com/api/external/organization/list";
        String url = activityUrl + "/api/external/organization/list";
        try {
            String result = WSUtil.sendRequestPostJsonWithHead(url,paraJson,getHead(paraJson)).getEntity(String.class);

            JSONObject resultJson = JSON.parseObject(result);
            if(resultJson == null || !"200".equals(resultJson.getString("code"))) {
                return null;
            }

            String data = resultJson.getString("data");
            return JSON.parseArray(data);
        }catch (Exception e) {
            log.error("listOrg error",e);
        }
        return null;
    }

    public List<Map<String,Object>> listOrgMember(String mobile,String orgId) {//根据手机号和组织ID查询组织中的所有人员信息
        List<Map<String,Object>> orgs = new ArrayList<>();

        JSONObject paraJson = new JSONObject();
        paraJson.put("mobile",mobile);
        paraJson.put("organizationId",orgId);
        String url = activityUrl + "/api/member/listFromOrganization";
        try {
            String result = WSUtil.sendRequestPostJsonWithHead(url,paraJson,getHead()).getEntity(String.class);

            JSONObject resultJson = JSON.parseObject(result);
            if(resultJson == null || !"200".equals(resultJson.getString("code"))) {
                return null;
            }

            String data = resultJson.getString("data");
            JSONArray resultArray = JSON.parseArray(data);
            for(int i=0;i<resultArray.size();i++) {
                JSONObject json = resultArray.getJSONObject(i);
                Map<String,Object> groupMap = new HashMap<>();
                groupMap.put("memberListId",json.getString("memberListId"));
                groupMap.put("memberMobile",json.getString("memberMobile"));
                groupMap.put("memberName",json.getString("memberName"));
                groupMap.put("portrait",json.getString("portrait"));
                groupMap.put("vipLevel",json.getString("vipLevel"));
                groupMap.put("resigned",json.getBoolean("resigned"));
                groupMap.put("currentOrganizationId",json.getString("currentOrganizationId"));
                groupMap.put("currentOrganizationName",json.getString("currentOrganizationName"));
                orgs.add(groupMap);
            }
        }catch (Exception e) {
            log.error("getOrgs error",e);
        }
        return orgs;
    }

    private Map<String,Object> getHead(JSONObject paraJson) {
        long timestamp = System.currentTimeMillis();
        StringBuilder line = new StringBuilder();
        if(paraJson.get("email") != null) {
            line.append("email=").append(paraJson.getString("email")).append("&");
        }
        if(paraJson.get("mobile") != null) {
            line.append("mobile=").append(paraJson.getString("mobile")).append("&");
        }
        /*Set<String> keySet = paraJson.keySet();
        for(String key : keySet) {
            line.append(key).append("=").append(paraJson.getString(key)).append("&");
        }*/
        line.append("secretKey=3b3c7a1c9c8b4d3c9d8e7f6a5b4c3d2&timestamp=").append(timestamp);
        String sign = getHash(line.toString());
        Map<String,Object> headMap = new HashMap<>();
        headMap.put("Member-Timestamp", timestamp);
        headMap.put("Member-Sign", sign);
        return headMap;
    }

    private String getHash(String str) {
        try {
            // 获取SHA-256 MessageDigest 实例
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // 对字符串进行哈希计算
            byte[] hashBytes = digest.digest(str.getBytes());

            // 将哈希值转换为十六进制字符串
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            // 输出哈希值
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }


    /*private String upload(String urlSuffix, JSONObject paraJson,String filePath) {
        try {
            Map<String,Object> headMap = getHead(paraJson);

            String result = HttpUtil.uploadToSign(activityUrl + urlSuffix,new File(filePath),headMap,paraJson);
            if(StringUtils.isBlank(result)) {
                return null;
            }
            return result;
        } catch (Exception e) {
            log.error("upload legion error,url:{}", urlSuffix,e);
        }
        return null;
    }*/

    public static void main(String[] args) {
        JSONObject paraJson = new JSONObject();
        List<Long> labelIds = new ArrayList<>();
        labelIds.add(307L);
        labelIds.add(313L);

        paraJson.put("momentId",1);
            paraJson.put("content","打卡日报测试");
            paraJson.put("mobile","13861404295");
            paraJson.put("labelIds",labelIds);
            paraJson.put("recordSource",1);
//        new CloudApiService().addMoment(paraJson);
        new CloudApiService().listOrg("13771720310","jun.zhang@tongfudun.com");
//        new CloudApiService().getLabelInfo("13861404295",null);
//        new CloudApiService().getLabelInfo("19020230013",null);
    }
}
