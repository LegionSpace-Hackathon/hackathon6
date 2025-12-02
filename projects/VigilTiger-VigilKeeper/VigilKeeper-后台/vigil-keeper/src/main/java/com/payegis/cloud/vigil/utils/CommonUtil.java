package com.payegis.cloud.vigil.utils;

import org.apache.commons.lang.StringUtils;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;

import static com.payegis.cloud.vigil.common.CommonConstant.SEP_POINT;

public class CommonUtil {

	public static String buildMessage(String message){
		return message;
	}

	public static boolean isNullOrEmpty(Object value) {
		if (value instanceof Collection) {
			if (value == null || ((Collection)value).isEmpty()) {
				return true;
			}
		} else if (value instanceof String) {
			if (value == null || "".equals(value.toString().trim())) {
				return true;
			}
		} else if (value == null) {
			return true;
		}

		return false;
	}
	
	public static String buildMessage(String code, String message){
		if(isNullOrEmpty(code)){
			return message;
		}else{
			return "["+code+"] " + message;
		}		
	}
	public static boolean checkFileType(String str, String type){
		if(str==null || str.trim().isEmpty()){
			return false;
		}
		
		String stype = StringUtils.substringAfterLast(str,SEP_POINT);
		
		return stype.equalsIgnoreCase(type);
	}
	
	public static String rename(String str, String appendStr){
		if( str == null || str.trim().isEmpty()){
			return "";
		}
		
		int index = str.lastIndexOf(SEP_POINT);
		String pre= str.substring(0, index);
		String fix= str.substring(index);
		
		return pre+appendStr+fix;		
	}

	public static String formatDate(Date date, String format){
		SimpleDateFormat sf = new SimpleDateFormat(format);
		return sf.format(date);
	}
	
	public static Date parseDate(String date, String format){
		Date d=null;
		try {
			SimpleDateFormat sf = new SimpleDateFormat(format);
			d=sf.parse(date);
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return d;
	}
	
    public static String getCurrentDateString(String format) {
        return new SimpleDateFormat(format).format(new Date(System.currentTimeMillis()));
    }
	
	public static String formatDoubleToString(long b){
		DecimalFormat df = new DecimalFormat("#.00");
		
		return df.format(b);
	}
	
	public static double formatDouble(long b){
		BigDecimal big = new BigDecimal(b);
		return big.setScale(2,BigDecimal.ROUND_HALF_UP).doubleValue();
	}
	
	public static boolean isWindows(){
		boolean flag = false;
		if (System.getProperties().getProperty("os.name").toUpperCase().indexOf("WINDOWS") != -1) {
			flag = true;
		}
		return flag;
	}
	
	public static int getInt(String val){
		int ret=0;
		try{
			ret=Integer.parseInt(val);
		}catch(Exception e){}
		
		return ret;
	}
	
	public static int getBetweenHours(Date start, Date end){
		int diff=0;
		if(null!=start && null!=end){
			long temp=(end.getTime()-start.getTime())/(1000*60*60);
			diff=new Long(temp).intValue();
		}
		return diff;
	}
	
	public static int getBetweenDays(Date start, Date end){
		int diff=0;
		if(null!=start && null!=end){
			long temp=(end.getTime()-start.getTime())/(1000*60*60*24);
			diff=new Long(temp).intValue();
		}
		return diff;
	}
	
	public static int compareTimeStr(String date1, String date2, String format){
		int ret=0;
		Date d1=parseDate(date1, format);
		Date d2=parseDate(date2, format);
		if(d1.getTime()-d2.getTime()>0){
			ret=1;
		}else if(d1.getTime()-d2.getTime()==0){
			ret=0;
		}else{
			ret=-1;
		}
		return ret;
	}
}
