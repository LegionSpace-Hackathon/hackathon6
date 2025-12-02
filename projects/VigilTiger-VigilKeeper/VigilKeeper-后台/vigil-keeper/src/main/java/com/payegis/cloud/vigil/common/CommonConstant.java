package com.payegis.cloud.vigil.common;

public interface CommonConstant {

    String YYYYMMDDHHMMSS = "yyyyMMddHHmmss";
    String DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

    String SEP_BLANK = " ";
    String SEP_POINT = ".";

    String ANDROID_DEFAULT_ICON = "classpath:image/Occupying.png";
    String USER_DEFAULT_ICON = "classpath:image/user_default.png";

    String USER_ID = "userId";
    String TOKEN = "token";
    String SHARE_TOKEN = "share_token";
    String TMP_USER = "tmp_user";
    String BACK_TMP_USER = "back_tmp_user";
    String NULL_STR = "null";

    interface CustomerSource {
        int CHAIN_MEET = 1;
        int CHAIN_MEET_QR = 2;
        int WX_MINI = 3;
        int MOBILE_CODE = 4;
        int DCLOUD = 5;
        int GPT = 6;
        int AGENT = 7;
        int MOMENT = 8;
    }

    interface LoginSource {
        String CHAIN_MEET = "chainmeet";
        String WX_MINI = "wxmini";
        String PC = "pc";
        String GPT = "gpt";
        String MOMENT = "moment";
    }
}
