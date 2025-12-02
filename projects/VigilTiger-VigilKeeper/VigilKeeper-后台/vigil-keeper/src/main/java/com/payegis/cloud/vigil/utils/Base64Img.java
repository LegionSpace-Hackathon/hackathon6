/*
 * All rights Reserved, Copyright (C) TFD LIMITED 2017
 * FileName: Base64Img.java
 * Modify record:
 * NO. |		Date		|		Name		|		Content
 * 1   |	2017年10月26日		|	TFD)Fan Xin	|	original version
 */
package com.payegis.cloud.vigil.utils;

/**
 * class name:Base64Img <BR>
 * class description: please write your description <BR>
 * Remark: <BR>
 * @version 1.00 2017年10月26日
 * @author TFD)Fan Xin

     
                   _ooOoo_
                  o8888888o
                  88" . "88
                  (| -_- |)
                  O\  =  /O
               ____/`---'\____
             .'  \\|     |//  `.
            /  \\|||  :  |||//  \
           /  _||||| -:- |||||-  \
           |   | \\\  -  /// |   |
           | \_|  ''\---/''  |   |
           \  .-\__  `-`  ___/-. /
         ___`. .'  /--.--\  `. . __
      ."" '<  `.___\_<|>_/___.'  >'"".
     | | :  `- \`.;`\ _ /`;.`/ - ` : | |
     \  \ `-.   \_ __\ /__ _/   .-` /  /
======`-.____`-.___\_____/___.-`____.-'======
                   `=---='
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
			       佛祖开光       永无BUG
 */

import org.apache.commons.net.util.Base64;
import org.springframework.util.ResourceUtils;
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

import static com.payegis.cloud.vigil.common.CommonConstant.ANDROID_DEFAULT_ICON;
import static com.payegis.cloud.vigil.common.CommonConstant.USER_DEFAULT_ICON;

public class Base64Img { 
	
	public static void main(String[] args) {
//		String url="http://192.168.109.212/group1/M00/08/2E/wKht1VnvDKWATtVFAAAks0Hlqm8459.png";
		String url="https://anchun.tongfudun.com/static/media/home_bg2.40d75ebd.png";
		String base64 = GetImageStrFromUrl(url);
		GenerateImage(base64);

	}

    private static final BASE64Encoder base64Encoder = new BASE64Encoder();
	private static final BASE64Decoder base64Decoder = new BASE64Decoder();
    /** 
     * @Title: GetImageStrFromUrl 
     * @Description: TODO(将一张网络图片转化成Base64字符串) 
     * @param imgURL 网络资源位置 
     * @return Base64字符串 
     */  
    public static String GetImageStrFromUrl(String imgURL) {
        byte[] data = null;
        InputStream in = null;
        ByteArrayOutputStream out = null;
        try{
            URL url = new URL(imgURL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            in = connection.getInputStream();
            out = new ByteArrayOutputStream();
            byte[] b = new byte[1024];
            int len = 0;
            while((len =in.read(b)) != -1){
                out.write(b,0,len);
            }
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            try{
                if(in != null ){
                    in.close();
                }
            }catch (IOException e){
                e.getStackTrace();
            }
        }
        BASE64Encoder base = new BASE64Encoder();
        return base.encode(out.toByteArray());
    }

    /**
     * @Title: GetBytesStrFromUrl
     * @Description:
     * @param imgURL 网络资源位置
     * @return byte[]
     */
    public static byte[] GetBytesStrFromUrl(String imgURL) {
        byte[] data=null;
        InputStream in = null;
        ByteArrayOutputStream out = null;
        try{
            URL url = new URL(imgURL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            in = connection.getInputStream();
            out = new ByteArrayOutputStream();
            byte[] b = new byte[1024];
            int len = 0;
            while((len =in.read(b)) != -1){
                out.write(b,0,len);
            }
            out.flush();
            data = out.toByteArray();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            try{
                if(in != null ){
                    in.close();
                }
            }catch (IOException e){
                e.getStackTrace();
            }
        }

        return data;
    }

    /** 
     * @Title: GetImageStrFromPath 
     * @Description: TODO(将一张本地图片转化成Base64字符串) 
     * @param imgPath 
     * @return 
     */  
    public static String getImageStrFromPath(String imgPath) {
        InputStream in = null;  
        byte[] data = null;  
        // 读取图片字节数组  
        try {  
            in = new FileInputStream(imgPath);  
            data = new byte[in.available()];  
            in.read(data);  
            in.close();  
        } catch (IOException e) {  
            e.printStackTrace();  
        }  
        // 对字节数组Base64编码  
        BASE64Encoder encoder = new BASE64Encoder();  
        // 返回Base64编码过的字节数组字符串  
        return encoder.encode(data);  
    }  

    /**
     * @Title: GetImageStrFromPath
     * @Description: TODO(将一张本地图片转化成Base64字符串)
     * @return
     */
    public static String GetImageStrFromPath(byte[] data) {
        // 对字节数组Base64编码
        BASE64Encoder encoder = new BASE64Encoder();
        // 返回Base64编码过的字节数组字符串
        return encoder.encode(data);
    }

    /**
     * app图标格式转换
     * @param data
     * @return
     */
    /*public static String appIconImage(byte[] data){
        return base64Encoder.encode(data);
    }*/

    /** 
     * @Title: GenerateImage 
     * @Description: TODO(base64字符串转化成图片) 
     * @param imgStr 
     * @return 
     */  
    public static boolean GenerateImage(String imgStr) {  
        if (imgStr == null) // 图像数据为空  
            return false;  
        BASE64Decoder decoder = new BASE64Decoder();  
        try {  
            // Base64解码  
            byte[] b = decoder.decodeBuffer(imgStr);  
            for (int i = 0; i < b.length; ++i) {  
                if (b[i] < 0) {// 调整异常数据  
                    b[i] += 256;  
                }  
            }  
            // 生成jpeg图片  
            String imgFilePath = "e://22212.jpg";
            OutputStream out = new FileOutputStream(imgFilePath);  
            out.write(b);  
            out.flush();  
            out.close();  
            return true;  
        } catch (Exception e) {  
            return false;  
        }  
    }

    public static String appIconImage(byte[] data){
        if(data == null || data.length<=1){
            try {
                return getImageStrFromPath(ResourceUtils.getFile(ANDROID_DEFAULT_ICON).getAbsolutePath());
            } catch (FileNotFoundException e) {
                return null;
            }
        }
        return base64Encoder.encode(data);
    }

    public static String userHeadImg(byte[] data){
        if(data == null || data.length<=1){
            try {
                return getImageStrFromPath(ResourceUtils.getFile(USER_DEFAULT_ICON).getAbsolutePath());
            } catch (FileNotFoundException e) {
                return null;
            }
        }
        return base64Encoder.encode(data);

    }

    public static String encodeToString(byte[] bytes){
        if(bytes==null){
            return null;
        }
        return base64Encoder.encode(bytes);
    }

    public static byte[] stringToImage(String data) throws IOException {
        return base64Decoder.decodeBuffer(data);
    }

    public static String encodeToString2(byte[] bytes){
        if(bytes==null){
            return null;
        }
        return Base64.encodeBase64String(bytes);
    }
}  
