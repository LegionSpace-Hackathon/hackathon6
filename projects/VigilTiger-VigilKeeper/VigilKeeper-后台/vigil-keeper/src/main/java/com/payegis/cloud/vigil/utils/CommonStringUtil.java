package com.payegis.cloud.vigil.utils;

import com.alibaba.fastjson.JSONObject;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class CommonStringUtil {

    private static final Map<String, String> sdkAndroidVersion = new HashMap<String, String>();
    static {
        sdkAndroidVersion.put("30","Android API 30");
        sdkAndroidVersion.put("29","Android 10.0(Q)");
        sdkAndroidVersion.put("28","Android 9.0(Pie)");
        sdkAndroidVersion.put("27","Android 8.1(Oreo)");
        sdkAndroidVersion.put("26","Android 8.0(Oreo)");
        sdkAndroidVersion.put("25","Android 7.1.1(Nougat)");
        sdkAndroidVersion.put("24","Android 7.0(Nougat)");
        sdkAndroidVersion.put("23","Android 6.0(Marshmallow)");
        sdkAndroidVersion.put("22","Android 5.1(Lollipop)");
        sdkAndroidVersion.put("21","Android 5.0(Lollipop)");
        sdkAndroidVersion.put("20","Android 4.4W(KitKat Wear)");
        sdkAndroidVersion.put("19","Android 4.4(Kitkat)");
        sdkAndroidVersion.put("18","Android 4.3(Jelly Bean)");
        sdkAndroidVersion.put("17","Android 4.2(Jelly Bean)");
        sdkAndroidVersion.put("16","Android 4.1(Jelly Bean)");
        sdkAndroidVersion.put("15","Android 4.0.3(IceCreamSandwich)");
        sdkAndroidVersion.put("14","Android 4.0(IceCreamSandwich)");
        sdkAndroidVersion.put("13","Android 3.2(Honeycomb)");
        sdkAndroidVersion.put("12","Android 3.1(Honeycomb)");
        sdkAndroidVersion.put("11","Android 3.0(Honeycomb)");
        sdkAndroidVersion.put("10","Android 2.3.3(Gingerbread)");

    }

    public static String formatFileSize(Object size){
        if(size == null || !StringUtils.isNumeric(size.toString())) return "0";
        int bytes = Integer.parseInt(size.toString());
        if(bytes<=1024) {
            return size+"B";
        }else if(bytes>1024 && bytes<=1024*1024){
                return new BigDecimal(bytes).divide(new BigDecimal(1024),2, BigDecimal.ROUND_HALF_UP)+"K";
        }else if(bytes>1024*1024 && bytes<=1024*1024*1024){
            return new BigDecimal(bytes).divide(new BigDecimal(1024*1024),2, BigDecimal.ROUND_HALF_UP)+"M";
        }else{
            return new BigDecimal(bytes).divide(new BigDecimal(1024*1024*1024),2, BigDecimal.ROUND_HALF_UP)+"G";
        }
    }

    /**
     * 获取二维码
     * @param url
     * @return
     * @throws IOException
     * @throws WriterException
     */
    public static String getDownloadBitCode(String url) throws IOException, WriterException {
        if(StringUtils.isBlank(url)) return "";
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, 150, 150);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        return Base64Img.encodeToString(outputStream.toByteArray());
    }

    public static String getSafeTag(JSONObject riskData, JSONObject behaviorData){
        int highCount = riskData == null || riskData.getJSONObject("levelDistribution")==null ||
                !riskData.getJSONObject("levelDistribution").containsKey("highCount") ?0:
             riskData.getJSONObject("levelDistribution").getIntValue("highCount");
        int supernormalCount = behaviorData == null || behaviorData.getJSONObject("typeDistribution")==null ||
                !behaviorData.getJSONObject("typeDistribution").containsKey("supernormalCount")?0:
                behaviorData.getJSONObject("typeDistribution").getIntValue("supernormalCount");
        if(highCount>0 || supernormalCount>0) return "高危";
        return "安全";
    }

    public static String getCredibleTag(JSONObject contentData, JSONObject sdkData){
        int superContentCount = getContentViolationCount(contentData);
        int supernormalPermissionSDKCount = sdkData == null || sdkData.getJSONObject("distribution") == null ||
                !sdkData.getJSONObject("distribution").containsKey("supernormalPermissionSDKCount")?0:
                sdkData.getJSONObject("distribution").getIntValue("supernormalPermissionSDKCount");
        if(superContentCount == 0 && supernormalPermissionSDKCount == 0) return "可信";
        return null;
    }

    public static int getContentViolationCount(JSONObject contentData){
        int superContentCount = 0;
        if(contentData.getJSONArray("pie") != null && contentData.getJSONArray("pie").size()>0){
            for(int i =0 ;i<contentData.getJSONArray("pie").size();i++){
                if(contentData.getJSONArray("pie").getJSONObject(i) != null &&
                        contentData.getJSONArray("pie").getJSONObject(i).containsKey("value"))
                    superContentCount+=(contentData.getJSONArray("pie").getJSONObject(i).getIntValue("value"));
            }
        }
        return superContentCount;
    }

    public static String getAndroidVersion(String miniSdk){
        if(StringUtils.isNotBlank(miniSdk) && sdkAndroidVersion.containsKey(miniSdk))
            return sdkAndroidVersion.get(miniSdk);
        return "";
    }

    public static String getCHIndex(int num){
        int hundreds = num/100;
        int tens = (num-hundreds*100)/10;
        int units = num - 100*hundreds - 10*tens;
        String result="(";
        if(hundreds>0) result+=getCHNum(hundreds)+"百";
        if(tens>0){
            if(hundreds==0 && tens==1){
                result+="十";
            }else {
                result+=getCHNum(tens)+"十";
            }
        }else{
            if(hundreds>0){
                result+="零";
            }
        }
        result+=getCHNum(units);
        result+=")";
        return result;
    }

    public static String getCHNum(int num){
        switch (num){
            case 1:return "一";
            case 2:return "二";
            case 3:return "三";
            case 4:return "四";
            case 5:return "五";
            case 6:return "六";
            case 7:return "七";
            case 8:return "八";
            case 9:return "九";
            default:return "";
        }
    }

    public static String encodeFileName(String fileName, HttpServletRequest request, HttpServletResponse response) {
        String userAgent = request.getHeader("User-Agent");
        log.info("userAgent:{}",userAgent);
        if (fileName.endsWith(".pdf")){
            response.setContentType("application/pdf");
        }else if(fileName.endsWith(".png")){
            response.setContentType("image/png");
        }/*else if(fileName.endsWith(".apk")){
            response.setContentType("application/vnd.android.package-archive");
        }*/
        fileName = fileName.replace(" ","_");
        try {
            response.setHeader("Accept-Ranges", "bytes");
            userAgent = userAgent.toLowerCase();
            //去除空格
            if (userAgent.contains("firefox")) {
                fileName = new String(fileName.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);
                response.setHeader("Content-Disposition", "attachment; fileName=\"" + fileName + "\"");
            } else if (userAgent.contains("safari")) {
                fileName = URLEncoder.encode(fileName, "UTF8");
                response.setHeader("content-disposition", "attachment;fileName*=UTF-8''" + fileName);
            } else {//IE，google等其他浏览器
                fileName = URLEncoder.encode(fileName, "UTF8");
                response.setHeader("Content-Disposition", "attachment; fileName=\"" + fileName + "\"");
            }
        } catch (UnsupportedEncodingException e) {
            log.error("userAgent:{}",userAgent,e);
        }

        return fileName;
    }

    /**
     * 获取请求的IP
     * @param request
     * @return
     */
    public static String getRequestIp(HttpServletRequest request){
        String ip = request.getHeader("x-forwarded-for");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP")==null?request.getHeader("X-Real-IP".toLowerCase()):null;
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP")==null?request.getHeader("Proxy-Client-IP".toLowerCase()):null;
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP")==null?request.getHeader("WL-Proxy-Client-IP".toLowerCase()):null;
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP")==null?request.getHeader("HTTP_CLIENT_IP".toLowerCase()):null;
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR")==null?request.getHeader("HTTP_X_FORWARDED_FOR".toLowerCase()):null;
        }
        if (ip != null && ip.indexOf(",") != -1) {
            ip = ip.substring(0,ip.indexOf(","));
        }
        return ip;
    }

    public static boolean isTelPhoneNum(String telNum){
        Pattern p = Pattern.compile("^(0[0-9]{2,3}-)?([2-9][0-9]{6,7})+(-[0-9]{1,4})?$");
        Matcher m = p.matcher(telNum);
        return m.matches();
    }

    public static boolean isMobileNumber(String mobiles){
        if(StringUtils.isBlank(mobiles)) {
            return false;
        }
        Pattern p = Pattern.compile("^((13[0-9])|(15[0-9])|(18[0-9])|(17[0-9])|(19[0-9]))\\d{8}$");
        Matcher m = p.matcher(mobiles);
        return m.matches();

    }

    public static boolean isEmail(String email){
        if(StringUtils.isBlank(email)) {
            return false;
        }
        Pattern p = Pattern.compile("^.+@[a-z0-9]+.[a-z]{2,4}$");
        Matcher m = p.matcher(email);
        return m.matches();
    }

    public static String getCheckCode(){
       return  (int)(Math.random()*10)+""+
               (int)(Math.random()*10)+""+
               (int)(Math.random()*10)+""+
               (int)(Math.random()*10)+""+
               (int)(Math.random()*10)+""+
               (int)(Math.random()*10);
    }

    public static String get32UUID() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public static String getCodeToken(){
        return System.currentTimeMillis()+"_"+ UUID.randomUUID();
    }


    public static boolean compareVersion(String v1, String v2){
        if(v1==null || v1=="") return true;
        if((v2==null || v2=="")) return false;
        v1 = v1.trim().replaceAll("[a-zA-z]","");
        v2 = v2.trim().replaceAll("[a-zA-z]","");
        return v1.compareTo(v2)<0;
    }

    /**
     * 判断 v1 v2是否有改动 有改动 true
     * @param v1
     * @param v2
     * @return
     */
    public static boolean compare(String v1, String v2){
        if(v1==null && v2 ==null) return true;
        if(v1 != null && v2 == null) return false;
        return v1.equals(v2);
    }

    public static boolean compareBoolean(Boolean v1, Boolean v2){
        if(v1==null && v2 ==null) return true;
        if(v1 != null && v2 == null) return false;
        return v1.equals(v2);
    }

    public static String replace(String old, String newsUrl){
        if(old==null){
            return null;
        }
        old = old.replaceAll("<img src=\"/\\w+?/market/","<img src=\""+newsUrl);
        old = old.replace("src=\"https://secapp-admin.tongfudun.com/appfortify/market/","src=\""+newsUrl)
                .replace("src=\"http://secapp-admin.tongfudun.com/appfortify/market/","src=\""+newsUrl)
                .replace("src=\"https://cloud-secapp.tongfudun.com/appfortify/market/","src=\""+newsUrl)
                .replace("src=\"http://cloud-secapp.tongfudun.com/appfortify/market/","src=\""+newsUrl);
            return old;

    }

    public static String getDefaultNick(String phone){
        if(StringUtils.isBlank(phone)) {
            phone = Math.random()*13+"";
        }
        Random random = new Random();
        StringBuffer valSb = new StringBuffer("小D_");
        valSb.append(Integer.toHexString(Integer.parseInt(phone.substring(0, phone.length() - 5))));
        String charStr= "abcdefghijklmnopqrstuvwxyz!@#$%^&*";
        valSb.append(charStr.charAt(random.nextInt(charStr.length())));
        valSb.append("_").append(phone.substring(phone.length()-4));
        return valSb.toString();
    }

    /**
     * 校验字符串是否由字母、数字、下划线“_”之间组合 成功返回false  失败返回true
     * @param conf
     * @return
     */
    public static boolean checkChannelPackageConf(String conf){
        return Pattern.matches("^[0-9a-zA-Z_]+$",conf);
    }

    public static boolean checkChannelName(String channelName){
        return Pattern.matches("^[0-9a-zA-Z_\u4e00-\u9fa5]+$",channelName);
    }


}
