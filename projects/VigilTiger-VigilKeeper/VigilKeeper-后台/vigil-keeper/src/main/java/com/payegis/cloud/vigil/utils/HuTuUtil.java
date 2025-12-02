package com.payegis.cloud.vigil.utils;

import cn.hutool.crypto.asymmetric.KeyType;
import cn.hutool.crypto.asymmetric.RSA;
import cn.hutool.json.JSONObject;
import com.alibaba.fastjson.JSON;

/**
 * 通付盾云登录信息加解密
 */
public class HuTuUtil {

    public static final String privateK = "MIIBUwIBADANBgkqhkiG9w0BAQEFAASCAT0wggE5AgEAAkEAjUCo+7NwwLm+Rl/E3SRnePI2DWW14MMAYIx0rMKh4KVj+1mykkSnKAoXv9XH9xzVsZgGhRy3CWF3Kwr/H7hGXQIDAQABAkAYOGWhXyfuzAqt238Qokzhxrpw+qdApn86jur0spz6PXCZKyxsVr8IKpF1CJuAIK1ZW4BkMKcfzLpejK4KRboRAiEAwddrZ/CQCx/8kXsrhEDhScNoBQtd9B9Zv8r5hMMnD6UCIQC6jC5n/AoHgI+z8/N1ahJ2Oxlg8iEwuv2zRLUTpMyeWQIgd3+oFTG2e0VC3SUDlMqymFjAvateRms1Vwl4faIZaIkCIE1H8Zmmckk1W1MDhyJnNQrB5Puik1lqvdtcZV+j8BjRAiAUBuEoVeeWS7UwjjxoOMY1UK4LUqDWIL1f1/ycbRYbnw==";
    public static final String pubilcK = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAI1AqPuzcMC5vkZfxN0kZ3jyNg1lteDDAGCMdKzCoeClY/tZspJEpygKF7/Vx/cc1bGYBoUctwlhdysK/x+4Rl0CAwEAAQ==";

    public static String encrypt(Object data) {
        RSA rsa = new RSA(privateK, pubilcK);
        return rsa.encryptHex(JSON.toJSONString(data), KeyType.PublicKey);
    }

    public static String decrypt(String dataStr){
        RSA rsa = new RSA(privateK, pubilcK);
        return rsa.decryptStr(dataStr, KeyType.PrivateKey);
    }

    public static String encryptStr(Object data) {
        RSA rsa = new RSA(privateK, pubilcK);
        return rsa.encryptHex(data.toString(), KeyType.PublicKey);
    }

    public static String objToJsonStr(Object o){
        JSONObject jsonObject = new JSONObject(o);
        return jsonObject.toString();
    }


}
