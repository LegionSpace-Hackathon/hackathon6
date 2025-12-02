package com.payegis.cloud.vigil.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.net.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESKeySpec;
import javax.crypto.spec.IvParameterSpec;
import java.security.Key;

@Slf4j
public class DESUtil {
    private final static byte[] IV_DEFAULT = {1,1,1,1,1,1,1,1};
    private static final String ALGORITHM = "DES";
    private static final String CIPHER_ALGORITHM = "DES/CBC/PKCS5Padding";
    private static final String CHARSET = "utf-8";
    private static final String password = "tong_fu_dun2021#";
    private static final char[] HEX_CHAR = {'0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'};
    //private static BASE64Encoder base64Encoder = new BASE64Encoder();
    //private static BASE64Decoder base64Decoder = new BASE64Decoder();

    private static Key generateKey(String password) throws Exception {
        DESKeySpec desKeySpec = new DESKeySpec(password.getBytes());
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(ALGORITHM);
        return keyFactory.generateSecret(desKeySpec);
    }

    /**
     * 加密
     * @param data
     * @return
     */
    public static String encrypt(Object data){
        if(data == null) return null;
        try {
            Key secretKey = generateKey(password);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            IvParameterSpec iv = new IvParameterSpec(IV_DEFAULT);
            cipher.init(Cipher.ENCRYPT_MODE,secretKey,iv);
            byte[] bytes = cipher.doFinal(data.toString().getBytes());
            return byteToHex(bytes);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static String byteToHex(byte[] bytes){
        char[] buf = new char[bytes.length*2];
        int index =0;
        for(byte b:bytes){
            buf[index++] = HEX_CHAR[b >>> 4 & 0xf];
            buf[index++] = HEX_CHAR[b & 0xf];
        }
        return new String(buf);
    }

    public static byte[] hexToByte(String hexStr){
        byte[] bytes = new byte[hexStr.length()/2];
        for(int i=0;i<hexStr.length()/2;i++){
            String subStr = hexStr.substring(i*2,i*2+2);
            bytes[i] = (byte)Integer.parseInt(subStr,16);
        }
        return bytes;
    }

    /**
     * 解密
     * @param data
     * @return
     */
    public static Integer decrypt(String data){
        if(data == null) return null;
        try {
            byte[] text = hexToByte(data);
            Key secretKey = generateKey(password);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            IvParameterSpec iv = new IvParameterSpec(IV_DEFAULT);
            cipher.init(Cipher.DECRYPT_MODE,secretKey,iv);
            byte[] original = cipher.doFinal(text);
            String  str = new String(original,CHARSET);
            if(StringUtils.isNumeric(str)) return Integer.parseInt(str);
            return null;
        } catch (Exception e) {
            log.info("",e);
            return null;
        }
    }

    /**
     * 解密
     * @param data
     * @return
     */
    public static Long decryptToLong(String data){
        if(data == null) return null;
        try {
            String str = decryptStr(data);
            if(StringUtils.isNumeric(str)) return Long.parseLong(str);
            return null;
        } catch (Exception e) {
            log.info("",e);
            return null;
        }
    }

    /**
     * 解密
     * @param data
     * @return
     */
    public static String decryptStr(String data){
        try {
            byte[] text = hexToByte(data);
            Key secretKey = generateKey(password);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            IvParameterSpec iv = new IvParameterSpec(IV_DEFAULT);
            cipher.init(Cipher.DECRYPT_MODE,secretKey,iv);
            byte[] original = cipher.doFinal(text);
            return new String(original,CHARSET);
        } catch (Exception e) {
            log.info("",e);
            return null;
        }
    }


    /**
     * 加密
     * @param data
     * @return
     */
    public static String encrypt2(Object data){
        try {
            Key secretKey = generateKey(password);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            IvParameterSpec iv = new IvParameterSpec(IV_DEFAULT);
            cipher.init(Cipher.ENCRYPT_MODE,secretKey,iv);
            byte[] bytes = cipher.doFinal(data.toString().getBytes());
            return Base64.encodeBase64URLSafeString(bytes);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }


    /**
     * 解密
     * @param data
     * @return
     */
    public static String decrypt2(String data){
        try {
            Key secretKey = generateKey(password);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            IvParameterSpec iv = new IvParameterSpec(IV_DEFAULT);
            cipher.init(Cipher.DECRYPT_MODE,secretKey,iv);
            byte[] original = cipher.doFinal(Base64.decodeBase64(data));
            String  str = new String(original,CHARSET);
            return str==null?"":str;
        } catch (Exception e) {
            log.error("",e);
            return "";
        }
    }

    public static void main(String[] args) {
//        System.out.println(encrypt(958));
       // System.out.println(decrypt("afaa3e22daf819b2"));
        //System.out.println(encrypt2("com.tongfudun.dtcmessenger"));
        System.out.println(decrypt2("kq3AuXf0sQVGALdALrW9l-q7h0yyjDfg9eeOqsa0iQKaIuQM5RcEZsnubmzySG5XkeljuwePb9VKozDHZMAv0zISgEgXg9jp2jF-5adBs1s"));
    }
}
