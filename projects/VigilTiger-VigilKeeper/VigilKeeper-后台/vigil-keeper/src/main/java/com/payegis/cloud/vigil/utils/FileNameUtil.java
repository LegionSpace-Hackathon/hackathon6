package com.payegis.cloud.vigil.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;

@Slf4j
public class FileNameUtil {


    public static String formatVersion(String version) {
        if (StringUtil.isNotEmpty(version) && !version.startsWith("V") && !version.startsWith("v")) {
            version = "V" + version;
        }
        return version;
    }

    public static String formatFileName(boolean hasPrefix,String appName,String version,String time,String title) {
        return formatFileName(hasPrefix,appName,version,time,title,".pdf");
    }

    public static String formatFileName(boolean hasPrefix,String appName,String version,String time,String title,String fileType) {
        String filename = "";
        if(hasPrefix) {
            filename = "通付盾";
        }
        filename += "《" + appName.replaceAll(" ", "") + version + "》"+ title;
        if(time.length()>10) {
            filename += "_" + time.substring(0, 10);
        }
        filename += fileType;
        return filename;
    }

    public static String formatFileName(String source,String appName,String version,String time,String title) {
        boolean hasPrefix = StringUtils.isBlank(source) || "tfd".equals(source);
        return formatFileName(hasPrefix,appName,version,time,title);
    }

    public static String replaceAsterisk(String replaceStr) {
        return replaceStr.replaceAll("\\s*", "");
    }

    public static String encodeFileName(String filename,String userAgent) {
        try {
            if (userAgent.contains("firefox")||userAgent.contains("safari")) {
                filename = new String(filename.getBytes(StandardCharsets.UTF_8), "ISO8859-1");
            } else {
                filename = URLEncoder.encode(filename, "UTF-8");
            }
        } catch (UnsupportedEncodingException e) {
            log.error("",e);
        }

        return filename;
    }

    static String REGEX_HL = "-";
    static String REGEX_COLON = ":";

    static String NULL_STR = "";
    static String BLANK_STR = " ";
    static String UNDERLINE = "_";

    public static String buildFileName(String reportName,String title) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy_MM_dd_HH_mm_ss");
        StringBuilder stringBuilder = new StringBuilder("《");
        stringBuilder.append(title)
                .append("》").append(reportName).append(UNDERLINE)
                .append(dateFormat.format(new Date()));

        String filename = stringBuilder.toString();
        filename = filename.replace(BLANK_STR, NULL_STR);
        filename = filename.replace(REGEX_COLON, UNDERLINE);
        return filename;
    }

    public static String encodeFileName(String fileName, HttpServletRequest request, HttpServletResponse response) {
        String userAgent = request.getHeader("User-Agent");
        if (fileName.endsWith(".pdf")){
            response.setContentType("application/pdf");
        }
        fileName = fileName.replace(" ","_");
        try {
            //去除空格
            if (StringUtils.contains(userAgent, "Firefox")) {
                fileName = new String(fileName.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);
                response.setHeader("Content-Disposition", "attachment; fileName=\"" + fileName + "\"");
            } else if (StringUtils.contains(userAgent.toLowerCase(), "safari")) {
                fileName = URLEncoder.encode(fileName, "UTF8");
                response.setHeader("content-disposition", "attachment;fileName*=UTF-8''" + fileName);
            } else {//IE，google等其他浏览器
                fileName = URLEncoder.encode(fileName, "UTF8");
                response.setHeader("Content-Disposition", "attachment; fileName=\"" + fileName + "\"");
            }
        } catch (UnsupportedEncodingException e) {
            log.error("", e);
        }

        return fileName;
    }

}
