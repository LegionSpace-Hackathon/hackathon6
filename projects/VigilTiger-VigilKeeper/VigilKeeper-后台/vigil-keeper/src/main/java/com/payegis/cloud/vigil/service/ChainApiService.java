package com.payegis.cloud.vigil.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.core.ret.RetCode;
import com.payegis.cloud.vigil.exception.ApplicationException;
import com.payegis.cloud.vigil.utils.Base64Utils;
import com.payegis.cloud.vigil.utils.HttpUtil;
import com.payegis.cloud.vigil.utils.WSUtil;
import com.payegis.cloud.vigil.utils.chainmeet.SignatureUtil;
import com.sun.jersey.api.client.ClientResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ChainApiService {
    private static final String SUCCESS_CODE = "000000";
    @Value("${chain.meet.url}")
    private String chainUrl;
    @Value("${chain.meet.appId}")
    private String chainAppId;
    @Value("${chain.meet.appSecret}")
    private String chainAppSecret;

    @Value("${legion.url}")
    private String legionUrl;
    @Value("${legion.appId}")
    private String legionAppId;
    @Value("${legion.appSecret}")
    private String legionAppSecret;

    public String getAudioTxt(File file) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("fileLength",file.length());
        try {
            String fileBase64 = Base64Utils.encodeFile(file.getAbsolutePath());
            fileBase64 = fileBase64.replaceAll("\r|\n","");
            paraJson.put("fileBase64", fileBase64);
        } catch (Exception e) {
            log.warn("{}",e.getMessage());
            throw new ApplicationException(RetCode.FAIL.code,"文件转换异常");
        }

        String result = post("/speech/getText/base64",paraJson);
        JSONObject dataJson = getDataJson(result);
        if(dataJson == null) {
            throw new ApplicationException(RetCode.FAIL.code,"服务繁忙，稍后再试");
        }
        return dataJson.getString("speechText");
    }

    public Map<String, List<String>> getFriends(String mobile, String email) {
        Map<String, List<String>> friends = new HashMap<>();
        List<String> mobiles = new ArrayList<>();
        List<String> emails = new ArrayList<>();

        JSONObject paraJson = new JSONObject();
        paraJson.put("mobile",mobile);
        paraJson.put("email",email);
        String result = post("/user/friend/list",paraJson);
        JSONArray resultArray = getDataArray(result);
        if(resultArray == null) {
            return friends;
        }

        for(int i=0;i<resultArray.size();i++) {
            JSONObject json = resultArray.getJSONObject(i);
            String mobileTmp = json.getString("mobile");
            if(StringUtils.isNotBlank(mobileTmp)) {
                mobiles.add(mobileTmp);
                continue;
            }
            String emailTmp = json.getString("email");
            if(StringUtils.isNotBlank(emailTmp)) {
                emails.add(emailTmp);
            }
        }
        friends.put("mobiles",mobiles);
        friends.put("emails",emails);

        return friends;
    }

    public List<Map<String, Object>> getGroups(String mobile, String email) {
        List<Map<String, Object>> groups = new ArrayList<>();

        JSONObject paraJson = new JSONObject();
        paraJson.put("mobile",mobile);
        paraJson.put("email",email);
        String result = post("/im/groupListByMobile",paraJson);

        JSONArray resultArray = getDataArray(result);
        if(resultArray == null) {
            return groups;
        }

        for(int i=0;i<resultArray.size();i++) {
            JSONObject json = resultArray.getJSONObject(i);
            Map<String, Object> groupMap = new HashMap<>();
            groupMap.put("groupId",json.getString("groupId"));
            groupMap.put("groupName",json.getString("name"));
            groupMap.put("delFlag",json.getBoolean("delFlag"));
            groups.add(groupMap);
        }

        return groups;
    }

    public List<String> getGroupMembers(String groupId) {
        List<String> mobiles = new ArrayList<>();

        JSONObject paraJson = new JSONObject();
        paraJson.put("groupId",groupId);

        String result = post("/im/groupInfoById",paraJson);
        JSONObject dataJson = getDataJson(result);
        if(dataJson == null) {
            return mobiles;
        }

        JSONArray memberArray = dataJson.getJSONArray("groupMemberInfos");
        for(int i=0;i<memberArray.size();i++) {
            JSONObject json = memberArray.getJSONObject(i);
            mobiles.add(json.getString("groupId"));
        }

        return mobiles;
    }

    public String getFileUrl(String cId, String fileName) {

        return getFileUrl(cId,fileName,false);
    }

    public String getFileUrlPreview(String cId, String fileName) {

        return getFileUrl(cId,fileName,true);
    }

    public String getFileUrl(String cId, String fileName, boolean preview) {

        String urlSuffix = "/disk/preview?cid=%s&fileName=%s&preview=%s";
        try {
            urlSuffix = String.format(urlSuffix,cId, URLEncoder.encode(fileName, "UTF-8"),preview);
        } catch (UnsupportedEncodingException e) {
        }

        return legionUrl + urlSuffix;
    }

    public String getFileUrlPreview0(String cId, String fileName) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("cid",cId);
        paraJson.put("fileName",fileName);
        try {
            String result = postLegion("/disk/preview0", paraJson);
            log.info("getFileUrlNoPic Call Chain meet result:{}",result);

            if(StringUtils.isBlank(result)){
                return null;
            }
            JSONObject resultJson = JSON.parseObject(result);
            if(!SUCCESS_CODE.equals(resultJson.get("code"))) {
                log.warn("call chain result:{}",result);
                return null;
            }
            return resultJson.getString("data");
        } catch (Exception e) {
            log.error("getFileUrlNoPic {}",e.getMessage());
        }
        return null;
    }

    public JSONObject validTokenV1(String token) {
        long timeStamp = System.currentTimeMillis();
        JSONObject paraJson = new JSONObject();
        paraJson.put("token",token);
        paraJson.put("appId",chainAppId);
        paraJson.put("timestamp",timeStamp);
        try {
            String result = post("/lightApp/validToken/v1", paraJson);
            JSONObject dataJson = getDataJson(result);
            if(dataJson == null) {
                return null;
            }
            log.info("Login Call Chain meet times:{}", System.currentTimeMillis()-timeStamp);
            return dataJson;
        } catch (Exception e) {
            log.error("链上会token校验异常"+e.getMessage());
        }

        return null;
    }

    public void synOrderToChain(JSONArray orderList) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("pluginId",chainAppId);
        paraJson.put("syncPluginOrderList",orderList);
        try {
            long timeStamp = System.currentTimeMillis();
            String result = post("/open/sync/plugin/order", paraJson);
            log.info("synOrderToChain call chain meet times:{} result:{}", System.currentTimeMillis()-timeStamp,result);
        } catch (Exception e) {
            log.error("synOrderToChain {}",e.getMessage());
        }
    }

    public void synNewUserToChain(List<Map<String, Object>> userList) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("pluginId",chainAppId);
        paraJson.put("syncPluginUserList",userList);
        try {
            long timeStamp = System.currentTimeMillis();
            String result = post("/open/sync/plugin/new/user", paraJson);
            log.info("synNewUserToChain call chain meet times:{} result:{}", System.currentTimeMillis()-timeStamp,result);
        } catch (Exception e) {
            log.error("synNewUserToChain {}",e.getMessage());
        }
    }

    public void synActiveUserToChain(List<Map<String, Object>> userList) {
        JSONObject paraJson = new JSONObject();
        paraJson.put("pluginId",chainAppId);
        paraJson.put("syncPluginUserList",userList);
        try {
            long timeStamp = System.currentTimeMillis();
            String result = post("/open/sync/plugin/active/user", paraJson);
            log.info("synActiveUserToChain call chain meet times:{} result:{}", System.currentTimeMillis()-timeStamp,result);
        } catch (Exception e) {
            log.error("synActiveUserToChain {}",e.getMessage());
        }
    }

    public String getAppId() {
        return chainAppId;
    }

    public String genToken(String mobile, String email) {
        JSONObject paraJson = new JSONObject();
        if(StringUtils.isNotBlank(mobile)) {
            paraJson.put("mobile", mobile);
        }
        if(StringUtils.isNotBlank(email)) {
            paraJson.put("email", email);
        }
        try {
            long timeStamp = System.currentTimeMillis();
            String result = postLegion("/disk/get/directUpload/token", paraJson);
            log.info("genToken call chain meet times:{} result:{}", System.currentTimeMillis()-timeStamp,result);

            return getDataString(result);
        } catch (Exception e) {
            log.error("genToken {}",e.getMessage());
        }

        return null;
    }
    public JSONObject uploadFile(String mobile, String email,String fileName,String filePath) {
        String token = genToken(mobile,email);

        JSONObject paraJson = new JSONObject();
        if(StringUtils.isNotBlank(mobile)) {
            paraJson.put("mobile", mobile);
        }
        if(StringUtils.isNotBlank(email)) {
            paraJson.put("email", email);
        }
        paraJson.put("fileName",fileName);
        try {
            long timeStamp = System.currentTimeMillis();
            String result = upload("/disk/directUpload", paraJson,token,filePath);
            log.info("uploadFile call legion times:{} result:{}", System.currentTimeMillis()-timeStamp,result);
            return getDataJson(result);
        } catch (Exception e) {
            log.error("uploadFile {}",e.getMessage());
        }

        return null;
    }



    private String post(String urlSuffix, JSONObject paraJson) {
        try {
            JSONObject headJson = getHeadJson(paraJson);

            ClientResponse response = WSUtil.sendRequestPostChainMeet(chainUrl + urlSuffix,headJson,paraJson);
            if(response.getStatus() != 200) {
                return null;
            }
            return response.getEntity(String.class);
        } catch (Exception e) {
            log.error("post chain meet api error,url:{}", urlSuffix,e);
        }
        return null;
    }

    private String postLegion(String urlSuffix, JSONObject paraJson) {
        try {
            JSONObject headJson = getLegionHeadJson(paraJson);

            ClientResponse response = WSUtil.sendRequestPostChainMeet(legionUrl + urlSuffix,headJson,paraJson);
            if(response.getStatus() != 200) {
                return null;
            }
            return response.getEntity(String.class);
        } catch (Exception e) {
            log.error("post legion error,url:{}", urlSuffix,e);
        }
        return null;
    }

    private String upload(String urlSuffix, JSONObject paraJson,String token,String filePath) {
        try {
            JSONObject headJson = getLegionHeadJson(paraJson);
            headJson.put("token",token);

            return HttpUtil.uploadToChainMeet(legionUrl + urlSuffix,new File(filePath),headJson,paraJson);
        } catch (Exception e) {
            log.error("upload legion error,url:{}", urlSuffix,e);
        }
        return null;
    }

    private JSONObject getHeadJson(JSONObject paraJson) {
        long timestamp = System.currentTimeMillis();
        JSONObject headJson = new JSONObject();
        headJson.put("timestamp",timestamp);
        headJson.put("appId",chainAppId);
        headJson.put("signature", SignatureUtil.sign(paraJson.toJSONString(),chainAppSecret,timestamp));

        return headJson;
    }

    private JSONObject getLegionHeadJson(JSONObject paraJson) {
        long timestamp = System.currentTimeMillis();
        JSONObject headJson = new JSONObject();
        headJson.put("timestamp",timestamp);
        headJson.put("appId",legionAppId);
        headJson.put("signature", SignatureUtil.sign(paraJson.toJSONString(),legionAppSecret,timestamp));

        return headJson;
    }

    private JSONObject getDataJson(String result) {
        if(StringUtils.isBlank(result)){
            return null;
        }
        JSONObject resultJson = JSON.parseObject(result);
        if(!SUCCESS_CODE.equals(resultJson.get("code"))) {
            log.warn("call chain result:{}",result);
            return null;
        }

        return resultJson.getJSONObject("data");
    }

    private String getDataString(String result) {
        if(StringUtils.isBlank(result)){
            return null;
        }
        JSONObject resultJson = JSON.parseObject(result);
        if(!SUCCESS_CODE.equals(resultJson.get("code"))) {
            log.warn("call chain result:{}",result);
            return null;
        }

        return resultJson.getString("data");
    }

    private JSONArray getDataArray(String result) {
        if(StringUtils.isBlank(result)){
            return null;
        }
        JSONObject resultJson = JSON.parseObject(result);
        if(!SUCCESS_CODE.equals(resultJson.get("code"))) {
            log.warn("call chain result:{}",result);
            return null;
        }

        return resultJson.getJSONArray("data");
    }


}
