/**
 * NumberUtil.java
 * 
 * Copyright(C)2008 Founder Corporation.
 * written by Founder Corp.
 */
package com.payegis.cloud.vigil.utils;

import org.apache.commons.lang.math.NumberUtils;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.payegis.cloud.vigil.common.CommonConstant.SEP_POINT;

/**
 * [类名]<br>
 * NumberUtil<br>
 * [功能概要]<br>
 * <br>
 * <br>
 * [変更履歴]<br>
 *  ver1.00 新建 dong.li<br>
 * 
 * @author  dong.li
 * @version 1.00
 */
public class NumberUtil {
	
    public static final Pattern digest = Pattern.compile("(\\d+)");

    /**
     * 转换成整型
     * @param str
     * @return
     */
    public static int convertToInt(String str) {
        return Integer.parseInt(str.replaceAll(",", ""));
    }
    
    /**
     * 转换成BigDecimal
     */
    public static BigDecimal convertToBigDecimal(String str) {
        return new BigDecimal(str.replaceAll(",", ""));
    }
    
    /**
     * 非数字判断
     * @param str
     * @return
     */
	public static boolean isNumeric(String str){ 
	    Pattern pattern = Pattern.compile("[0-9]*"); 
	    return pattern.matcher(str).matches();    
	} 
	
	/**
     * 保留2位小数
     * @param number
     * @return
     */
	public static Double formatNumer(Double number){ 
		DecimalFormat df = new DecimalFormat("###.00"); 
	    return Double.valueOf(df.format(number));
	} 
	
	public static String formatNumer(Double number,String format){
		DecimalFormat df = new DecimalFormat(format); 
	    return df.format(number);
	}

	public static String dividedBy(int genuineAppSum, int appSum) {
		double result = ((double)genuineAppSum/(double)appSum)*100d;
		DecimalFormat df=new DecimalFormat("0.00");
		return df.format(result)+"%";
	}
	public static String dividedBy(long genuineAppSum, long appSum) {
		double result = ((double)genuineAppSum/(double)appSum)*100d;
		DecimalFormat df=new DecimalFormat("0.00");
		return df.format(result)+"%";
	}
	/** 
	 * 格式化数字为千分位显示； 
	 * @param 要格式化的数字； 
	 * @return 
	 */  
	public static String fmtMicrometer(String text)  
	{  
	    DecimalFormat df = null;  
	    if(text.indexOf(SEP_POINT) > 0)
	    {  
	        if(text.length() - text.indexOf(SEP_POINT)-1 == 0)
	        {  
	            df = new DecimalFormat("###,##0.");  
	        }else if(text.length() - text.indexOf(SEP_POINT)-1 == 1)
	        {  
	            df = new DecimalFormat("###,##0.0");  
	        }else  
	        {  
	            df = new DecimalFormat("###,##0.00");  
	        }  
	    }else   
	    {  
	        df = new DecimalFormat("###,##0");  
	    }  
	    double number = 0.0;  
	    try {  
	         number = Double.parseDouble(text);  
	    } catch (Exception e) {  
	        return text;  
	    }  
	    return df.format(number);  
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
}
