package com.payegis.cloud.vigil.utils;

import com.payegis.cloud.vigil.core.ret.RetResponse;
import com.payegis.cloud.vigil.core.ret.RetResult;
import org.apache.commons.lang3.StringUtils;

public class PasswordUtil {
    /**
     * NUM 数字
     * SMALL_LETTER 小写字母
     * CAPITAL_LETTER 大写字母
     * OTHER_CHAR  特殊字符
     */
    private static final int NUM = 1;
    private static final int SMALL_LETTER = 2;
    private static final int CAPITAL_LETTER = 3;
    private static final int OTHER_CHAR = 4;
    /**
     *检查字符类型，包括num、大写字母、小写字母和其他字符。
     *
     * @param c
     * @return
     */
    private static int checkCharacterType(char c) {
        if (c >= 48 && c <= 57) {
            return NUM;
        }
        if (c >= 65 && c <= 90) {
            return CAPITAL_LETTER;
        }
        if (c >= 97 && c <= 122) {
            return SMALL_LETTER;
        }
        return OTHER_CHAR;
    }

    /**
     * 按不同类型计算密码的数量
     *
     * @param passwd
     * @param type
     * @return
     */
    private static int countLetter(String passwd, int type) {
        int count = 0;
        if (null != passwd && passwd.length() > 0) {
            for (char c : passwd.toCharArray()) {
                if (checkCharacterType(c) == type) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * 检查密码的强度
     *
     * @param passwd
     * @return strength level
     */
    public static RetResult checkPasswordStrength(String passwd) {
        if (StringUtils.isBlank(passwd)) {
            return RetResponse.makeErrRsp("password is empty");
        }
        int len = passwd.length();
        // 增加点
        //判断密码是否含有数字有level++
        if (countLetter(passwd, NUM)  == 0) {
            return RetResponse.makeErrRsp("密码未包含数字");
        }
        //判断密码是否含有小写字母有level++
        if (countLetter(passwd, SMALL_LETTER) == 0) {
            return RetResponse.makeErrRsp("密码未包含小写字母");
        }
        //判断密码是否还有大写字母有level++
        if (countLetter(passwd, CAPITAL_LETTER) == 0) {
            return RetResponse.makeErrRsp("密码未包含大写字母");
        }
        //判断密码是否还有特殊字符有level++
        if (len > 6 && countLetter(passwd, OTHER_CHAR) == 0) {
            return RetResponse.makeErrRsp("密码未包含特殊字符");
        }

        return null;
    }
}
