package com.payegis.cloud.vigil.utils;


import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;

/**
 * 图片添加水印工具类
 * 文字水印 图片水印
 */
public class ImageWatermarkUtils {
    // 水印透明度
    private static float alpha = 0.5f;
    // 水印文字字体
//    private static Font font = new Font("宋体", Font.BOLD, 38);
    private static Font font = new Font("宋体", Font.PLAIN, 38);
    // 水印文字颜色
    private static Color color = Color.WHITE;
    /**
     * 给图片添加水印文字
     */
    public static byte[] markImageByText(byte[] image,String... text) {
        //FileOutputStream os = null;
        ByteArrayOutputStream outputStream = null;
        ByteArrayInputStream inputStream = null;
        try {
            //String targerPath = "C:\\Users\\yupei.wang\\Desktop\\rz\\250.png";
            // 1、源图片
            inputStream = new ByteArrayInputStream(image);
            Image srcImg = ImageIO.read(inputStream);
            BufferedImage buffImg = new BufferedImage(srcImg.getWidth(null), srcImg.getHeight(null), BufferedImage.TYPE_INT_RGB);
            // 水印横向位置
            int positionWidth = 5;// buffImg.getWidth();
            // 水印纵向位置
            int positionHeight = buffImg.getHeight()-15;
            // 2、得到画笔对象
            Graphics2D g = buffImg.createGraphics();
            // 3、设置对线段的锯齿状边缘处理
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(srcImg.getScaledInstance(srcImg.getWidth(null), srcImg.getHeight(null), Image.SCALE_SMOOTH), 0, 0, null);
            // 5、设置水印文字颜色
            g.setColor(color);
            // 6、设置水印文字Font
            g.setFont(font);
            // 7、设置水印文字透明度
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_ATOP, alpha));
            // 8、第一参数->设置的内容，后面两个参数->文字在图片上的坐标位置(x,y)
            if(text.length==2){
                g.drawString(text[0], positionWidth, positionHeight-35);
                g.drawString(text[1], positionWidth, positionHeight);
            }else {
                g.drawString(text[0], positionWidth, positionHeight);
            }

            // 9、释放资源
            g.dispose();
            // 10、生成图片
             //os= new FileOutputStream(targerPath);
             //ImageIO.write(buffImg, "JPG", os);
             outputStream= new ByteArrayOutputStream();
             ImageIO.write(buffImg,"jpg",outputStream);
             return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            try {
                if(inputStream != null){
                    inputStream.close();
                }
//                if(os !=null){
//                    os.close();
//                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

}
