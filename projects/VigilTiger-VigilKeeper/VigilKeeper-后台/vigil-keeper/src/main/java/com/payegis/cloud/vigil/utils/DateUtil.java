package com.payegis.cloud.vigil.utils;

import org.apache.commons.lang.StringUtils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import static com.payegis.cloud.vigil.common.CommonConstant.DATE_FORMAT;

public class DateUtil {
    public static final String FORMAT_MM = "yyyy-MM";
    public static final String FORMAT_CH = "yyyy年MM月dd日";
    public static final String FORMAT_YYYY_MM_DD = "yyyy-MM-dd";
    public static final String YYYYMMDD = "yyyyMMdd";

    public static boolean isCurrentDay(String dateTime){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(FORMAT_YYYY_MM_DD);
        String d1 = dateTime.substring(0,10);
        String d2 = simpleDateFormat.format(new Date());
        if(d1.equals(d2)) return true;
        return false;
    }

    public static boolean isInControlMinutes(String dateTime,int minutes){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(DATE_FORMAT);
        Date date;
        try {
            date = simpleDateFormat.parse(dateTime);
        } catch (ParseException e) {
            e.printStackTrace();
            return false;
        }
        return new Date().getTime()-date.getTime()<1000*60*minutes;
    }

    public static boolean isInControlHours(Date dateTime,int hours){
        if(dateTime==null)return false;
        return new Date().getTime()-dateTime.getTime()<1000*60*60*hours;
    }

    public static String getCurrentTime(){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(DATE_FORMAT);
        return simpleDateFormat.format(new Date());
    }

    public static String getCurrentHM(){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("mm:ss");
        return simpleDateFormat.format(new Date());
    }

    public static String getCurrentDate(){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(YYYYMMDD);
        return simpleDateFormat.format(new Date());
    }

    public static String getCurrentDateWithLine(){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(FORMAT_YYYY_MM_DD);
        return simpleDateFormat.format(new Date());
    }

    public static String getCurrentDateCH(){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(FORMAT_CH);
        return simpleDateFormat.format(new Date());
    }

    public static String addDays(int days){
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date());
        calendar.add(Calendar.DAY_OF_YEAR,days);
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(DATE_FORMAT);
        return simpleDateFormat.format(calendar.getTime());
    }

    public static Date addHour2Date(int hour){
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date());
        calendar.add(Calendar.HOUR_OF_DAY,hour);
        return calendar.getTime();
    }

    public static Date addDays2Date(int days){
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date());
        calendar.add(Calendar.DAY_OF_YEAR,days);
        return calendar.getTime();
    }

    public static Date addDays2Date(Date sourceDate,int days){
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(sourceDate);
        calendar.add(Calendar.DAY_OF_YEAR,days);
        return calendar.getTime();
    }

    public static String formatDate(Date date){
        if(date == null){
            return "";
        }
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(DATE_FORMAT);
        return simpleDateFormat.format(date);
    }

    public static String formatDate(Date date,String pattern){
        if(date == null){
            return "";
        }
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern);
        return simpleDateFormat.format(date);
    }

    public static Date parseDate(String datetime){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(DATE_FORMAT);
        try {
            return simpleDateFormat.parse(datetime);
        } catch (ParseException e) {
            return null;
        }
    }

    public static String getDate(){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(FORMAT_YYYY_MM_DD);
        return simpleDateFormat.format(new Date());
    }

    public static String getCurrentDateString(String format) {
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(format);
        return simpleDateFormat.format(new Date(System.currentTimeMillis()));
    }

    public static boolean checkTimeString(String date){
        if(StringUtils.isBlank(date)){
            return false;
        }
        try {
            new SimpleDateFormat(DATE_FORMAT).parse(date);
            return true;
        } catch (ParseException e) {
            return false;
        }
    }

    public static boolean isValid(String date){
        if(StringUtils.isBlank(date)){
            return false;
        }
        try {
            SimpleDateFormat format = new SimpleDateFormat(FORMAT_YYYY_MM_DD);
            Date formatDate = format.parse(date);

            return date.equals(format.format(formatDate));
        } catch (ParseException e) {
            return false;
        }
    }

    public static boolean isValidNoOther(String date){
        if(StringUtils.isBlank(date)){
            return false;
        }
        try {
            SimpleDateFormat format = new SimpleDateFormat(YYYYMMDD);
            Date formatDate = format.parse(date);

            return date.equals(format.format(formatDate));
        } catch (ParseException e) {
            return false;
        }
    }

    public static String rmTimeEndSpotAndZero(String dateTime){
        if(dateTime == null){
            return null;
        }
        dateTime = dateTime.replaceFirst("\\.0$","");
        return dateTime;
    }

    /**
     * 判断是否超过几个工作日
     * @param start
     * @param end
     * @param day
     * @return
     */
    public static boolean isOverWorkingDays(Date start, Date end,int day) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(start);
        int startWeekDay = calendar.get(Calendar.DAY_OF_WEEK);
        int startYearDay = calendar.get(Calendar.DAY_OF_YEAR);

        calendar.setTime(end);
        int endYearDay = calendar.get(Calendar.DAY_OF_YEAR);

        int overDays = endYearDay - startYearDay;

        if(Calendar.SATURDAY==startWeekDay) {//周六
            return overDays>day+1;
        }else if(Calendar.FRIDAY==startWeekDay || Calendar.THURSDAY==startWeekDay) {//周五、周四
            return overDays>day+2;
        }else {
            return overDays>day;
        }

    }

    /**
     * 判断是否同一天
     * @param oneDate
     * @param twoDate
     * @return
     */
    public static Boolean isSameDay(Date oneDate, Date twoDate){
        SimpleDateFormat sdf = new SimpleDateFormat(FORMAT_YYYY_MM_DD);
        return sdf.format(oneDate).equals(sdf.format(twoDate));
    }

    public static String getBeforeMonth(int month) {
        SimpleDateFormat sdf = new SimpleDateFormat(FORMAT_MM);
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.MONTH,-month);

        return sdf.format(calendar.getTime());

    }

}
