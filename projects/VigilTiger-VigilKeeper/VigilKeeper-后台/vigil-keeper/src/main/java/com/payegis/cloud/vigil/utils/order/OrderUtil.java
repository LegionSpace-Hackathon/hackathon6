package com.payegis.cloud.vigil.utils.order;

import com.payegis.cloud.vigil.exception.ApplicationException;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.text.SimpleDateFormat;
import java.util.*;

import static com.payegis.cloud.vigil.common.CommonConstant.YYYYMMDDHHMMSS;
import static javax.crypto.Cipher.getInstance;

public class OrderUtil {

    public static String getTranDate(Date date) {
        return new SimpleDateFormat("yyyyMMdd").format(date);
    }

    public static String getTranTime(Date date) {
        String time = new SimpleDateFormat(YYYYMMDDHHMMSS).format(date);
        return time.substring(8);
    }

    /**
     * 在制定的时间上加或减去几分钟
     *
     * @param date
     * @param minute
     * @return
     */
    public static Date Minute(Date date, int minute) {
        java.util.Calendar Cal = java.util.Calendar.getInstance();
        Cal.setTime(date);
        Cal.add(java.util.Calendar.MINUTE, minute);
        return Cal.getTime();
    }

    // date类型转换为String类型
    // formatType格式为yyyy-MM-dd HH:mm:ss//yyyy年MM月dd日 HH时mm分ss秒
    // data Date类型的时间
    public static String dateToString(Date data, String formatType) {
        return new SimpleDateFormat(formatType).format(data);
    }


    private static final String CIPHER_TRANSFORMATION = "AES/ECB/PKCS5Padding";

    public static String encrypt(String sSrc, String sKey){
        if (sKey == null) {
            return null;
        }
        // 判断Key是否为32位
        if (sKey.length() != 16) {
            return null;
        }
        byte[] raw = sKey.getBytes();
        SecretKeySpec skeySpec = new SecretKeySpec(raw, "AES");
        Cipher cipher = null;// "算法/模式/补码方式"
        try {
            cipher = getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, skeySpec);
            byte[] encrypted = cipher.doFinal(sSrc.getBytes());
            return Base64.getEncoder().withoutPadding().encodeToString(encrypted);// 转换成base64
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }


    public static String getWxOutTradeNo(String outTradeNo,int payType) {
        return outTradeNo+"_"+payType;
    }

    public static synchronized String getNewOrderId() {
        String order_no = dateToString(new Date(), YYYYMMDDHHMMSS);
        order_no = order_no + RandomUtil.getRandom(6);
        return order_no;
    }

    public static synchronized String getAgreementNo() {
        String agreementNo = "D"+dateToString(new Date(), YYYYMMDDHHMMSS);
        agreementNo = agreementNo + RandomUtil.getRandom(6);
        return agreementNo;
    }


    public static Map<String, String> toMap(HttpServletRequest request) {
        Map<String, String> params = new HashMap<String, String>();
        Map<String, String[]> requestParams = request.getParameterMap();
        for (Iterator<String> iter = requestParams.keySet().iterator(); iter.hasNext(); ) {
            String name = iter.next();
            String[] values = requestParams.get(name);
            String valueStr = "";
            for (int i = 0; i < values.length; i++) {
                valueStr = (i == values.length - 1) ? valueStr + values[i] : valueStr + values[i] + ",";
            }
            // 乱码解决，这段代码在出现乱码时使用。
            // valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");
            params.put(name, valueStr);
        }
        return params;
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("x-forwarded-for");
        if (ip == null || ip.length() == 0 || "unknow".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
            if (ip.equals("127.0.0.1")) {
                //根据网卡取本机配置的IP
                InetAddress inet = null;
                try {
                    inet = InetAddress.getLocalHost();
                } catch (Exception e) {
                    throw new ApplicationException("ip获取失败");
                }
                ip = inet.getHostAddress();
            }
        }
        // 多个代理的情况，第一个IP为客户端真实IP,多个IP按照','分割
        if (ip != null && ip.length() > 15) {
            if (ip.indexOf(",") > 0) {
                ip = ip.substring(0, ip.indexOf(","));
            }
        }
        return ip;
    }



}
