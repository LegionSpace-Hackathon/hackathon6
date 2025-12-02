package com.payegis.cloud.vigil.utils;

import org.apache.commons.lang.math.NumberUtils;

import java.io.UnsupportedEncodingException;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


/**
 * 
 * 
 *
 */
public class StringUtil {
    /**
     * 默认的空值
     */
    public static final String EMPTY = "";
    
    public static final Pattern digest = Pattern.compile("(\\d+)");

    /**
     * 转换成字符串,如果对象为Null,则返回空字符串
     * 
     * @param obj
     *            需要判断的对象数组
     * @return boolean
     */
    public static String valueOf(Object obj) {
        if (obj != null) {
            return obj.toString();
        }
        return "";
    }

    /**
     * 检查字符串是否为空
     * 
     * @param str
     *            字符串
     * @return 是否为空
     */
    public static boolean isEmpty(Object str) {
        if (str == null || valueOf(str.toString().trim()).length() == 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 检查字符串是否不为空
     * 
     * @param str
     *            字符串
     * @return 是否不为空
     */
    public static boolean isNotEmpty(Object str) {
        return !isEmpty(str);
    }

    /**
     * 截取并保留标志位之前的字符串
     * 
     * @param str
     *            字符串
     * @param expr
     *            分隔符
     * @return 字符串
     */
    public static String substringBefore(String str, String expr) {
        if (isEmpty(str) || expr == null) {
            return str;
        }
        if (expr.length() == 0) {
            return EMPTY;
        }
        int pos = str.indexOf(expr);
        if (pos == -1) {
            return str;
        }
        return str.substring(0, pos);
    }

    /**
     * 截取并保留标志位之后的字符串
     * 
     * @param str
     *            字符串
     * @param expr
     *            分隔符
     * @return 字符串
     */
    public static String substringAfter(String str, String expr) {
        if (isEmpty(str)) {
            return str;
        }
        if (expr == null) {
            return EMPTY;
        }
        int pos = str.indexOf(expr);
        if (pos == -1) {
            return EMPTY;
        }
        return str.substring(pos + expr.length());
    }

    /**
     * 截取并保留最后一个标志位之前的字符串
     * 
     * @param str
     *            字符串
     * @param expr
     *            分隔符
     * @return 字符串
     */
    public static String substringBeforeLast(String str, String expr) {
        if (isEmpty(str) || isEmpty(expr)) {
            return str;
        }
        int pos = str.lastIndexOf(expr);
        if (pos == -1) {
            return str;
        }
        return str.substring(0, pos);
    }

    /**
     * 截取并保留最后一个标志位之后的字符串
     * 
     * @param str
     *            字符串
     * @param expr
     *            分隔符
     * @return 字符串
     */
    public static String substringAfterLast(String str, String expr) {
        if (isEmpty(str)) {
            return str;
        }
        if (isEmpty(expr)) {
            return EMPTY;
        }
        int pos = str.lastIndexOf(expr);
        if (pos == -1 || pos == (str.length() - expr.length())) {
            return EMPTY;
        }
        return str.substring(pos + expr.length());
    }

    /**
     * 把字符串按分隔符转换为数组
     * 
     * @param string
     *            字符串
     * @param expr
     *            分隔符
     * @return 字符串数组
     */
    public static String[] split(String string, String expr) {
        return string.split(expr);
    }

    /**
     * 去除字符串中的空格
     * 
     * @param str
     *            字符串
     * @return 去除空格后的结果
     */
    public static String noSpace(String str) {
        str = str.trim();
        str = str.replace(" ", "_");
        return str;
    }

    /**
     * 截取指定长度的字符串，并将被截掉的字符转化为...
     * 
     * @param str
     *            要截取的字符串
     * @param length
     *            要截取的长度
     * @return 字符串
     */
    public static String toSubSuspension(String str, int length) {
        if (StringUtil.isEmpty(str)) {
            return str;
        }
        if(str.length()>length){
        	 str = str.substring(0, length) + "...";
        } 
       
        return str;
    }

    /**
     * 比较字符串是否相等
     * 
     * @param str1
     *            字符串
     * @param str2
     *            字符串
     * @return boolean
     */
    public static boolean equals(String str1, String str2) {
        if (str1 == null && str2 == null) {
            return true;
        }
        if ("".equals(str1) && "".equals(str2)) {
            return true;
        }
        if(null == str1 && null != str2){
        	return false;
        }
        return str1.equals(str2);
    }

    /**
     * 字节数组获取MD5字符串
     * @param source
     * @return
     */
    public static String getMD5(byte[] source) {
		String s = null;
		char hexDigits[] = { // 用来将字节转换成 16 进制表示的字符
		'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd',
				'e', 'f' };
		try {
			java.security.MessageDigest md = java.security.MessageDigest
					.getInstance("MD5");
			md.update(source);
			byte tmp[] = md.digest(); // MD5 的计算结果是一个 128 位的长整数，
										// 用字节表示就是 16 个字节
			char str[] = new char[16 * 2]; // 每个字节用 16 进制表示的话，使用两个字符，
											// 所以表示成 16 进制需要 32 个字符
			int k = 0; // 表示转换结果中对应的字符位置
			for (int i = 0; i < 16; i++) { // 从第一个字节开始，对 MD5 的每一个字节
											// 转换成 16 进制字符的转换
				byte byte0 = tmp[i]; // 取第 i 个字节
				str[k++] = hexDigits[byte0 >>> 4 & 0xf]; // 取字节中高 4 位的数字转换,
															// >>>
															// 为逻辑右移，将符号位一起右移
				str[k++] = hexDigits[byte0 & 0xf]; // 取字节中低 4 位的数字转换
			}
			s = new String(str); // 换后的结果转换为字符串
		} catch (Exception e) {
			e.printStackTrace();
		}
		return s;
	}
    
    public static String ios2utf(String str){
    	byte bb[] = null;
        try {
			bb = str.getBytes("ISO-8859-1");//以"ISO-8859-1"方式解析name字符串
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		} 
        try {
        	str= new String(bb, "UTF-8");//再用"utf-8"格式表示name
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		} 
    	return str;
    }
    /**
     * 生成随机字符串
     * @param length
     * @return
     */
    public static String getRandString(int length){
        String ranomString="";
        String randString = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
        Random random = new Random();
        for(int i=1;i<length+1;i++){
            ranomString +=String.valueOf(String.valueOf(randString.charAt(random.nextInt(randString.length()))));;
        }
        return ranomString;
        
    }
    public static void main(String[] args) {
        System.out.println("随机字符串:"+StringUtil.underscoreName("providerNo"));
        System.out.println(StringUtil.getMD5("test".getBytes()));
    }
    /**
     * 将驼峰式命名的字符串转换为下划线大写方式。如果转换前的驼峰式命名的字符串为空，则返回空字符串。</br>
     * 例如：HelloWorld->HELLO_WORLD
     * @param name 转换前的驼峰式命名的字符串
     * @return 转换后下划线大写方式命名的字符串
     */
    public static String underscoreName(String name) {
        StringBuilder result = new StringBuilder();
        if (name != null && name.length() > 0) {
            // 将第一个字符处理成大写
            result.append(name.substring(0, 1).toUpperCase());
            // 循环处理其余字符
            for (int i = 1; i < name.length(); i++) {
                String s = name.substring(i, i + 1);
                // 在大写字母前添加下划线
                if (s.equals(s.toUpperCase()) && !Character.isDigit(s.charAt(0))) {
                    result.append("_");
                }
                // 其他字符直接转成大写
                result.append(s.toUpperCase());
            }
        }
        return result.toString();
    }
    /**
     * 将下划线大写方式命名的字符串转换为驼峰式。如果转换前的下划线大写方式命名的字符串为空，则返回空字符串。</br>
     * 例如：HELLO_WORLD->HelloWorld
     * @param name 转换前的下划线大写方式命名的字符串
     * @return 转换后的驼峰式命名的字符串
     */
    public static String camelName(String name) {
        StringBuilder result = new StringBuilder();
        // 快速检查
        if (name == null || name.isEmpty()) {
            // 没必要转换
            return "";
        } else if (!name.contains("_")) {
            // 不含下划线，仅将首字母小写
            return name.substring(0, 1).toLowerCase() + name.substring(1);
        }
        // 用下划线将原始字符串分割
        String camels[] = name.split("_");
        for (String camel :  camels) {
            // 跳过原始字符串中开头、结尾的下换线或双重下划线
            if (camel.isEmpty()) {
                continue;
            }
            // 处理真正的驼峰片段
            if (result.length() == 0) {
                // 第一个驼峰片段，全部字母都小写
                result.append(camel.toLowerCase());
            } else {
                // 其他的驼峰片段，首字母大写
                result.append(camel.substring(0, 1).toUpperCase());
                result.append(camel.substring(1).toLowerCase());
            }
        }
        return result.toString();
    }
    
    public static long covertDownloads(String downloads) {
        if (downloads == null || downloads.trim().length() == 0)
            return 0l;
        if (NumberUtils.isDigits(downloads)) {
            return Long.parseLong(downloads);
        } else {
            Matcher matcher = digest.matcher(downloads);
            long result = 0l;
            while (matcher.find()) {
                final Long d = Long.parseLong(matcher.group());
                if (d > result)
                    result = d;
            }
            if (downloads.contains("千") && !downloads.contains("千万")) {
                return result * 1000l;
            }
            if (downloads.contains("万") || downloads.contains("W")) {
                result = result * 10000l;
            }
            if (downloads.contains("十万")) {
                return result * 10l;
            }
            if (downloads.contains("百万")) {
                return result * 100l;
            }
            if (downloads.contains("千万")) {
                return result * 1000l;
            }
            if (downloads.contains("亿")) {
                result = result * 100000000l;
            }
            return result;
        }
    }

    /**
     * 校验字符串是否由字母、数字、下划线“_”之间组合 成功返回false  失败返回true
     * @param conf
     * @return
     */
    public static boolean checkChannelPackageConf(String conf){
        return Pattern.matches("^[0-9a-zA-Z_]{1,}$",conf);
    }

    public static boolean checkChannelName(String channelName){
        return Pattern.matches("^[0-9a-zA-Z_\u4e00-\u9fa5]{1,}$",channelName);
    }
}
