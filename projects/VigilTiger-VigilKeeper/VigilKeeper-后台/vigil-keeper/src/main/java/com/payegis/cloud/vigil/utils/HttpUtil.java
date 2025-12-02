package com.payegis.cloud.vigil.utils;

import com.alibaba.fastjson.JSONObject;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.mime.HttpMultipartMode;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;

import java.io.File;
import java.util.Map;
import java.util.Set;

public class HttpUtil {
    private final static ContentType CONTENT_TYPE = ContentType.create(HTTP.PLAIN_TEXT_TYPE,HTTP.UTF_8);
    public static String uploadToChainMeet(String url, File file, JSONObject headJson,JSONObject paraJson){
        String response = null;
        try {
            CloseableHttpClient httpclient = null;
            CloseableHttpResponse httpresponse = null;
            try {
                httpclient = HttpClients.createDefault();
                HttpPost httppost = new HttpPost(url);

                httppost.setHeader("Accept", "application/json");
                httppost.setHeader("os", "platform");
                httppost.setHeader("X-Header-Timestamp",headJson.getString("timestamp"));
                httppost.setHeader("X-Header-App-ID",headJson.getString("appId"));
                httppost.setHeader("X-Header-Signature",headJson.getString("signature"));
                if(headJson.get("token") != null) {
                    httppost.setHeader("Authorization", "Bearer " + headJson.get("token"));
                }

                //设置超时时间
                int timeOut = 30000;
                RequestConfig requestConfig = RequestConfig.custom().setConnectionRequestTimeout(timeOut)
                        .setConnectTimeout(timeOut).setSocketTimeout(timeOut).build();
                httppost.setConfig(requestConfig);
                //文件转Multipart
                MultipartEntityBuilder multipartEntityBuilder = MultipartEntityBuilder.create();
                multipartEntityBuilder.setMode(HttpMultipartMode.RFC6532);
                multipartEntityBuilder.addBinaryBody("file", file, ContentType.DEFAULT_BINARY, file.getName());

                Set<String> keySet = paraJson.keySet();
                for (String key : keySet) {
//                    StringBody stringBody = new StringBody(paraJson.getString(key),CONTENT_TYPE);
//                    multipartEntityBuilder.addPart(key, stringBody);
                    multipartEntityBuilder.addTextBody(key, paraJson.getString(key),ContentType.TEXT_PLAIN.withCharset("UTF-8"));
                }

                httppost.setEntity(multipartEntityBuilder.build());
                //执行
                httpresponse = httpclient.execute(httppost);
                response = EntityUtils.toString(httpresponse.getEntity());

            } finally {
                if (httpclient != null) {
                    httpclient.close();
                }
                if (httpresponse != null) {
                    httpresponse.close();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    public static String uploadToSign(String url, File file, Map<String,Object> headMap, JSONObject paraJson){
        String response = null;
        try {
            CloseableHttpClient httpclient = null;
            CloseableHttpResponse httpresponse = null;
            try {
                httpclient = HttpClients.createDefault();
                HttpPost httppost = new HttpPost(url);

                for(Map.Entry<String,Object> entry : headMap.entrySet()) {
                    httppost.setHeader(entry.getKey(),entry.getValue().toString());
                }

                //设置超时时间
                int timeOut = 30000;
                RequestConfig requestConfig = RequestConfig.custom().setConnectionRequestTimeout(timeOut)
                        .setConnectTimeout(timeOut).setSocketTimeout(timeOut).build();
                httppost.setConfig(requestConfig);
                //文件转Multipart
                MultipartEntityBuilder multipartEntityBuilder = MultipartEntityBuilder.create();
                multipartEntityBuilder.setMode(HttpMultipartMode.RFC6532);
                multipartEntityBuilder.addBinaryBody("file", file, ContentType.DEFAULT_BINARY, file.getName());

                Set<String> keySet = paraJson.keySet();
                for (String key : keySet) {
                    multipartEntityBuilder.addTextBody(key, paraJson.getString(key),ContentType.TEXT_PLAIN.withCharset("UTF-8"));
                }

                httppost.setEntity(multipartEntityBuilder.build());
                //执行
                httpresponse = httpclient.execute(httppost);
                response = EntityUtils.toString(httpresponse.getEntity());

            } finally {
                if (httpclient != null) {
                    httpclient.close();
                }
                if (httpresponse != null) {
                    httpresponse.close();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    public static String uploadToConvert(String url, File file){
        String response = null;
        try {
            CloseableHttpClient httpclient = null;
            CloseableHttpResponse httpresponse = null;
            try {
                httpclient = HttpClients.createDefault();
                HttpPost httppost = new HttpPost(url);

                //设置超时时间
                int timeOut = 30000;
                RequestConfig requestConfig = RequestConfig.custom().setConnectionRequestTimeout(timeOut)
                        .setConnectTimeout(timeOut).setSocketTimeout(timeOut).build();
                httppost.setConfig(requestConfig);
                //文件转Multipart
                MultipartEntityBuilder multipartEntityBuilder = MultipartEntityBuilder.create();
                multipartEntityBuilder.setMode(HttpMultipartMode.RFC6532);
                multipartEntityBuilder.addBinaryBody("file", file, ContentType.DEFAULT_BINARY, file.getName());

                httppost.setEntity(multipartEntityBuilder.build());
                //执行
                httpresponse = httpclient.execute(httppost);
                response = EntityUtils.toString(httpresponse.getEntity());

            } finally {
                if (httpclient != null) {
                    httpclient.close();
                }
                if (httpresponse != null) {
                    httpresponse.close();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

}
