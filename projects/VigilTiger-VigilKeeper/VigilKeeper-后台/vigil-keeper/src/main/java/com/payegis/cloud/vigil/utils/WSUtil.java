package com.payegis.cloud.vigil.utils;

import com.alibaba.fastjson.JSONObject;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.representation.Form;
import com.sun.jersey.core.util.MultivaluedMapImpl;
import lombok.extern.slf4j.Slf4j;

import javax.ws.rs.core.MediaType;
import java.io.File;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

@Slf4j
public class WSUtil {

    /**
     * 发送get请求
     * @param url
     * @return
     */
    public static ClientResponse sendRequestGetWithAuth(String url,Object token) {
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.header("Authorization","Bearer "+token).get(ClientResponse.class);
    }

    public static ClientResponse sendRequestPostEncryptData(String url, JSONObject jsonObj) {
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.accept(MediaType.APPLICATION_JSON).type(MediaType.TEXT_PLAIN).post(ClientResponse.class, HuTuUtil.encrypt(jsonObj));
    }

    /**
     * post请求参数
     * @param url
     * @param param
     * @return
     */
    public static ClientResponse sendRequestPostTxt(String url, String param,String appId) {
        Client client = Client.create();
        WebResource rs = client.resource(url);

        return rs.accept(MediaType.APPLICATION_JSON).type(MediaType.TEXT_PLAIN).header("appId",appId).post(ClientResponse.class, param);
    }

    /**
     * post请求json参数
     * @param url
     * @param jsonObj
     * @return
     */
    public static ClientResponse sendRequestPostJson(String url, JSONObject jsonObj) {
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.accept(MediaType.APPLICATION_JSON).type(MediaType.APPLICATION_JSON).post(ClientResponse.class, jsonObj.toJSONString());
    }
    public static ClientResponse sendRequestPostJsonWithHead(String url, JSONObject jsonObj,Map<String, Object> headMap) {
        Client client = Client.create();
        WebResource rs = client.resource(url);
        WebResource.Builder builder = rs.getRequestBuilder();
        for(Map.Entry<String,Object> entry : headMap.entrySet()) {
            builder.header(entry.getKey(),entry.getValue());
        }
        return builder.accept(MediaType.APPLICATION_JSON).type(MediaType.APPLICATION_JSON).post(ClientResponse.class, jsonObj.toJSONString());
    }


    public static ClientResponse sendRequestPostWithFormData(String url,Map<String, String> paraMap) {
        log.info("Webservice post url:" + url);
        Form formParam = new Form();
        for (Map.Entry<String, String> entry : paraMap.entrySet()) {
            log.info("param: key:" + entry.getKey() + " value:" + entry.getValue());
            formParam.add(entry.getKey(), entry.getValue());
        }
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.type(MediaType.APPLICATION_FORM_URLENCODED).post(ClientResponse.class, formParam);
    }


    public static ClientResponse sendRequestPostChainMeetValid(String url, JSONObject jsonObj,String signature) {
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.accept(MediaType.APPLICATION_JSON).header("signature",signature).type(MediaType.APPLICATION_JSON).post(ClientResponse.class, jsonObj.toJSONString());
    }

    public static ClientResponse sendRequestPostChainMeet(String url, JSONObject headJson,JSONObject paraJson) {
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.accept(MediaType.APPLICATION_JSON)
                .header("os","platform")
                .header("X-Header-Timestamp",headJson.get("timestamp"))
                .header("X-Header-App-ID",headJson.get("appId"))
                .header("X-Header-Signature",headJson.get("signature"))
                .type(MediaType.APPLICATION_JSON)
                .post(ClientResponse.class, paraJson.toJSONString());
    }


    /**
     * 发送get请求
     *
     * @param url
     * @return
     */
    public static ClientResponse sendRequestGet(String url) {
        Client client = Client.create();
        client.setConnectTimeout(5000);
        WebResource rs = client.resource(url);
        return rs.get(ClientResponse.class);
    }

    /**
     * 发送get请求
     *
     * @param url
     * @return
     */
    public static ClientResponse sendRequestGetWithHead(String url,Map<String,Object> headMap) {
        Client client = Client.create();
        client.setConnectTimeout(5000);
        WebResource rs = client.resource(url);
        WebResource.Builder builder = rs.getRequestBuilder();
        for(Map.Entry<String,Object> entry : headMap.entrySet()) {
            builder.header(entry.getKey(),entry.getValue());
        }
        return builder.get(ClientResponse.class);

    }

    /**
     * @param url
     * @return
     */
    public static ClientResponse sendRequestPost(String url, JSONObject jsonOb) {
        log.info("Webservice post url:" + url + " params:" + jsonOb);
        MultivaluedMapImpl params = constructWebserviceParams(jsonOb);
        Client client = Client.create();
        WebResource rs = client.resource(url);
        return rs.post(ClientResponse.class, params);
    }

    private static MultivaluedMapImpl constructWebserviceParams(JSONObject paramMap) {
        if (paramMap == null || paramMap.isEmpty()) {
            return null;
        }

        MultivaluedMapImpl params = new MultivaluedMapImpl();

        for (Iterator<String> it = paramMap.keySet().iterator(); it.hasNext();) {
            String key = it.next();
            params.add(key, paramMap.get(key));
        }
        return params;

    }

}
