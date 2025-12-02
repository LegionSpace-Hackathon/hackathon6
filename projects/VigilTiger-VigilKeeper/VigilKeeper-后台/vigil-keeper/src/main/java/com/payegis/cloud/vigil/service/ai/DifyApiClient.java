package com.payegis.cloud.vigil.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

public class DifyApiClient {
    private static final String API_BASE_URL = "https://api.dify.ai/v1";
    private final String apiKey;

    public DifyApiClient(String apiKey) {
        this.apiKey = apiKey;
    }

    public String post(String endpoint, String requestBody) throws Exception {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(API_BASE_URL + endpoint);

            // 设置请求头
            httpPost.setHeader("Authorization", "Bearer " + apiKey);
            httpPost.setHeader("Content-Type", "application/json");

            // 设置请求体
            httpPost.setEntity(new StringEntity(requestBody));

            // 执行请求
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                HttpEntity entity = response.getEntity();
                return EntityUtils.toString(entity);
            }
        }
    }

    public static void main(String[] args) {
        String apiKey = "your_api_key_here";
        DifyApiClient client = new DifyApiClient(apiKey);

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode requestBody = mapper.createObjectNode();
        requestBody.put("prompt", "请用Java写一个快速排序算法");
        requestBody.put("max_tokens", 1000);

        try {
            String response = client.post("/completions", requestBody.toString());
            System.out.println("API响应: " + response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
