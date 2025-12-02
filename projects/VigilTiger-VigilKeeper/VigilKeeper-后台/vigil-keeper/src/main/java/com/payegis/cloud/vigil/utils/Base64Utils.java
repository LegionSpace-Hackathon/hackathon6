package com.payegis.cloud.vigil.utils;

import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;

import java.io.*;

public class Base64Utils {

    /** *//**
     * 文件读取缓冲区大小
     */
    private static final int CACHE_SIZE = 1024;

    public static byte[] decode(String base64) throws Exception {
        return new BASE64Decoder().decodeBuffer(base64);
    }

    /** *//**
     * <p>
     * 二进制数据编码为BASE64字符串
     * </p>
     *
     * @param bytes
     * @return
     * @throws Exception
     */
    public static String encode(byte[] bytes) throws Exception {
        return new BASE64Encoder().encode(bytes);
    }

    public static String encodeFile(String filePath) throws Exception {
        byte[] bytes = fileToByte(filePath);
        return encode(bytes);
    }

    public static void decodeToFile(String filePath, String base64) throws Exception {
        byte[] bytes = decode(base64);
        byteArrayToFile(bytes, filePath);
    }

    public static byte[] fileToByte(String filePath)  {
        File file = new File(filePath);
        if (!file.exists()) {
            return null;
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream(2048);
        FileInputStream in = null;
        byte[] cache = new byte[CACHE_SIZE];
        try {
            in = new FileInputStream(file);

            int nRead;
            while ((nRead = in.read(cache)) != -1) {
                out.write(cache, 0, nRead);
            }
            out.flush();
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            try {
                out.close();
                if (in != null) {
                    in.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return out.toByteArray();
    }

    public static void byteArrayToFile(byte[] bytes, String filePath)  {
        InputStream in = new ByteArrayInputStream(bytes);
        File destFile = new File(filePath);
        OutputStream out = null;
        try {
            out = new FileOutputStream(destFile);

            byte[] cache = new byte[CACHE_SIZE];
            int nRead;
            while ((nRead = in.read(cache)) != -1) {
                out.write(cache, 0, nRead);
            }
            out.flush();
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            try {
                out.close();
                in.close();
            } catch (IOException e) {
                e.printStackTrace();
            }

        }


    }

    public static void byteArrayToOutStream(byte[] bytes, OutputStream out) throws IOException {
        InputStream in = new ByteArrayInputStream(bytes);
        byte[] cache = new byte[CACHE_SIZE];
        try {

            int nRead;
            while ((nRead = in.read(cache)) != -1) {
                out.write(cache, 0, nRead);
            }
            out.flush();
        } finally {
            try {
                out.close();
                in.close();
            } catch (IOException e) {
                e.printStackTrace();
            }

        }


    }


}
