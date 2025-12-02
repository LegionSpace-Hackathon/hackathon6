package com.payegis.cloud.vigil.utils.chainmeet;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.google.common.hash.Hashing;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;

/**
 * 对外开放接口的签名和校验
 *
 * 生成数字签名
 * <p>
 * 1.将所有非空参数按照参数名ASCII码从小到大排序（字典序），
 * 使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA
 * 2.拼接密钥secretKey
 * 3.拼接后的字符串HMAC-SHA256
 *
 * @author aikun.qiu
 */
public class SignatureUtil {

    public static String sign(String data, String appKey, Long timestamp) {
        JSONObject jsonObject = JSON.parseObject(data);
        Object[] keys = jsonObject.keySet().toArray();
        Arrays.sort(keys);
        StringBuilder strTemp = new StringBuilder();
        boolean isFirst = true;

        for (Object key : keys) {
            if (isFirst) {
                isFirst = false;
            } else {
                strTemp.append("&");
            }

            strTemp.append(key).append("=");
            Object value = jsonObject.get(key);
            String valueString = "";
            if (null != value) {
                valueString = String.valueOf(value);
            }
            strTemp.append(valueString);
        }

        strTemp.append("&").append("secretKey").append("=").append(appKey);
        strTemp.append("&").append("timestamp").append("=").append(timestamp);

        return Hashing.sha256().hashString(strTemp.toString(), StandardCharsets.UTF_8).toString();
    }

    public static String sign(Map<String, String[]> paramMap, String appKey, Long timestamp) {
        String[] keys = paramMap.keySet().stream().sorted().toArray(String[]::new);
        StringBuilder stringBuilder = new StringBuilder();
        boolean isFirst = true;
        for (String key :keys) {
            if (isFirst) {
                isFirst = false;
            } else {
                stringBuilder.append("&");
            }
            String[] values = paramMap.get(key);
            if (values.length > 1) {
                Arrays.stream(values).sorted().forEach((val) -> {
                    if (stringBuilder.lastIndexOf("&") != stringBuilder.length() - 1) {
                        stringBuilder.append("&");
                    }
                    stringBuilder.append(key).append("=");
                    stringBuilder.append(val);
                });
            } else {
                stringBuilder.append(key).append("=");
                stringBuilder.append(values[0]);
            }
        }

        stringBuilder.append("&").append("secretKey").append("=").append(appKey);
        stringBuilder.append("&").append("timestamp").append("=").append(timestamp);

        return Hashing.sha256().hashString(stringBuilder.toString(), StandardCharsets.UTF_8).toString();
    }

    public static boolean verify(String data, String appKey, Long timestamp, String originData) {
        String res = sign(data, appKey, timestamp);
        if (originData != null && originData.equals(res)) {
            return true;
        }
        return false;
    }
}
