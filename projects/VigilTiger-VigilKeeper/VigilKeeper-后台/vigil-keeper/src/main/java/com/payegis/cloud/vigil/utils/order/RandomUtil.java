package com.payegis.cloud.vigil.utils.order;

import java.util.Random;

/**
 * Created by xianzhu.lu on 2018/12/11.
 */
public class RandomUtil {

	private static final int PASSWORD_LENTH  = 10;
	private static final int SECRET_ID_LENTH = 6;

	public static String[] numberArray = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"};
	public static String[] charArray   = {
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u",
			"v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
			"Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"};

	public static String randomPassword() {
		StringBuilder builder = new StringBuilder();
		Random random = new Random();
		//第一位字母
		builder.append(charArray[random.nextInt(52)]);
		for (int index = 1; index < PASSWORD_LENTH; index++) {
			int numberOrChar = random.nextInt(2);
			//0数字,1字母
			if (numberOrChar == 0) {
				builder.append(numberArray[random.nextInt(10)]);
			} else {
				builder.append(charArray[random.nextInt(52)]);
			}
		}
		return builder.toString();
	}

	/**
	 * 随机生成6位secretId(数字)
	 *
	 * @return
	 */
	public static String randomSecretId() {
		StringBuilder builder = new StringBuilder();
		Random random = new Random();
		for (int index = 0; index < SECRET_ID_LENTH; index++) {
			builder.append(numberArray[random.nextInt(10)]);
		}
		return builder.toString();
	}

	public static String getRandom(){
		return (int)((Math.random()*9+1)*100000)+"";
	}

	//随机字符串生成
	public static String getRandomString(int length) { //length表示生成字符串的长度
		String base = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		Random random = new Random();
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < length; i++) {
			int number = random.nextInt(base.length());
			sb.append(base.charAt(number));
		}
		return sb.toString();
	}

	//随机字符串生成
	public static String getRandom(int length) { //length表示生成字符串的长度
		String base = "0123456789";
		Random random = new Random();
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < length; i++) {
			int number = random.nextInt(base.length());
			sb.append(base.charAt(number));
		}
		return sb.toString();
	}



}
