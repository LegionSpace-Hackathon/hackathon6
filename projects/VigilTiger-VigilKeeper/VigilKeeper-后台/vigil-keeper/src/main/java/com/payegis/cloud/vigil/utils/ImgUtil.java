package com.payegis.cloud.vigil.utils;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;

import static com.payegis.cloud.vigil.common.CommonConstant.SEP_POINT;

@Slf4j
public class ImgUtil {

    public static byte[] zoomImage(byte[] imgByte,int outSide) {
        ByteArrayInputStream byteIo = new ByteArrayInputStream(imgByte);
        BufferedImage srcImage;
        try {
            srcImage = ImageIO.read(byteIo);
        } catch (IOException e) {
            return imgByte;
        }
        int width = srcImage.getWidth();
        int height = srcImage.getHeight();
        if(width < outSide && height < outSide) {
            return imgByte;
        }
        float rate;
        if(width >= height) {
            rate = (float)outSide / width;
            width = outSide;
            height = (int)(height*rate);
        }else {
            rate = (float)outSide / height;
            height = outSide;
            width = (int)(width*rate);
        }

        ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
        try {
            BufferedImage dstImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics g = dstImage.getGraphics();
//            g.drawImage(srcImage, 0, 0, width, height, null);
            g.drawImage(srcImage.getScaledInstance(width, height, Image.SCALE_FAST), 0, 0, null);
            ImageIO.write(dstImage, "jpg", byteOut);
            g.dispose();
        } catch (Exception ex) {
            log.error("{}",ex.getMessage());
        }
        return byteOut.toByteArray();

    }

    public static byte[] zoomByMaxSize(byte[] inByte, int outSide) {

        try {
            ByteArrayInputStream byteIo = new ByteArrayInputStream(inByte);
            BufferedImage srcImage = ImageIO.read(byteIo);
            int width = srcImage.getWidth();
            int height = srcImage.getHeight();
            if(width < outSide && height < outSide) {
                return inByte;
            }

            ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
            Thumbnails.of(srcImage).size(outSide, outSide).outputFormat("jpg").toOutputStream(byteOut);

            return byteOut.toByteArray();
        } catch (IOException e) {
            return inByte;
        }
    }

    public static void zoomByMaxSize(String inSrc, String outSrc, int width, int height) throws IOException {
        Thumbnails.of(inSrc).size(width, height).toFile(outSrc);
    }

    public static void zoomBigImage(String src,String dest) throws IOException {
        zoomByMaxSize(src,dest,1080,1920);
    }

    public static void zoomImage(String src,String dest) throws IOException {
        zoomByMaxSize(src,dest,200,200);
//        zoomImage(src,dest,200);
    }
    public static void zoomImage(String src,String dest,Integer maxKb) throws IOException {
        zoomImageWithAto(src,dest,maxKb);
    }

    public static void zoomImageWithAto(String src,String dest,Integer kb) throws IOException {
        File srcFile = new File(src);
        long fileSize = srcFile.length();
        if (fileSize < kb * 1024) {//文件大于size k时，才进行缩放,注意：size以K为单位
            FileUtils.copyFile(srcFile,new File(dest));
            return;
        }

        float rate = (kb * 1024f) / fileSize; // 获取长宽缩放比例
        BufferedImage srcImage = ImageIO.read(srcFile);

        int width = (int)((double)srcImage.getWidth() * rate);
        int height = (int)((double)srcImage.getHeight() * rate);

        int imageType = srcImage.getType();
        imageType = srcImage.getType()==0?5:imageType;
        try {
            BufferedImage dstImage = new BufferedImage(width, height, imageType);
            AffineTransform transform = AffineTransform.getScaleInstance(rate, rate);
            AffineTransformOp ato = new AffineTransformOp(transform, AffineTransformOp.TYPE_BILINEAR);//AffineTransformOp.TYPE_BILINEAR
            BufferedImage tmpImage = ato.filter(srcImage, dstImage);
            int rotate = getAngle(srcFile);
            if(getAngle(srcFile)>0) {
                tmpImage = rotate(tmpImage,rotate);
            }
            ImageIO.write(tmpImage, StringUtils.substringAfterLast(dest,SEP_POINT), new File(dest));
        } catch (Exception ex) {
            log.error("{}",ex.getMessage());
            zoomImageWithDraw(src,dest,kb);
        }

    }

    public static void zoomImageWithDraw(String src,String dest,Integer kb) throws IOException {
        File srcFile = new File(src);
        long fileSize = srcFile.length();
        if (fileSize < kb * 1024) {//文件大于size k时，才进行缩放,注意：size以K为单位
            FileUtils.copyFile(srcFile,new File(dest));
            return;
        }
        BufferedImage srcImage = ImageIO.read(srcFile);

        float rate = (float)kb * 1024 / fileSize; // 获取长宽缩放比例
        rate = rate<0.1?0.1f:rate;
        int width = (int)((double)srcImage.getWidth() * rate);
        int height = (int)((double)srcImage.getHeight() * rate);
        int imageType = srcImage.getType();
        imageType = srcImage.getType()==0?5:imageType;

        try {
            BufferedImage dstImage = new BufferedImage(width, height, imageType);
            Graphics g = dstImage.getGraphics();
            g.drawImage(srcImage, 0, 0, width, height, null);
            ImageIO.write(dstImage, StringUtils.substringAfterLast(dest,SEP_POINT), new File(dest));
            g.dispose();
        } catch (Exception ex) {
            log.error("{}",ex.getMessage());
            FileUtils.copyFile(srcFile,new File(dest));
        }

    }

    public static void rotateImage(String img,int rotate) {
        File imgFile = new File(img);
        try {
            BufferedImage srcImage = ImageIO.read(imgFile);
            int w = srcImage.getWidth();
            int h = srcImage.getHeight();
            int type = srcImage.getColorModel().getTransparency();

            BufferedImage newImg = new BufferedImage(w, h,  type);

            Graphics2D graphics2d  = newImg.createGraphics();

            graphics2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BILINEAR);

            graphics2d.rotate(Math.toRadians(rotate), w / 2f, h / 2f);

            graphics2d.drawImage(srcImage, 0, 0, w,h,null);

            graphics2d.dispose();

            ImageIO.write(newImg, StringUtils.substringAfterLast(img,SEP_POINT),new File("E:\\long_r.jpg"));

            /*AffineTransform transform = new AffineTransform();
            transform.rotate(rotate, srcImage.getHeight()/2, srcImage.getWidth()/2  );
            AffineTransformOp ato = new AffineTransformOp(transform, AffineTransformOp.TYPE_BILINEAR);//AffineTransformOp.TYPE_BILINEAR
            BufferedImage tmpImage = ato.filter(srcImage, null);
            ImageIO.write(tmpImage, StringUtils.substringAfterLast(img,SEP_POINT),new File("E:\\long_r.jpg"));*/
        } catch (Exception ex) {
            log.error("{}",ex.getMessage());
        }

    }

    /**
     * 旋转角度
     * @param src 源图片
     * @param angel 角度
     * @return 目标图片
     */
    public static BufferedImage rotate(Image src, int angel) {
        int src_width = src.getWidth(null);
        int src_height = src.getHeight(null);
        // calculate the new image size
        Rectangle rect_des = calcRotatedSize(new Rectangle(new Dimension(src_width, src_height)), angel);

        BufferedImage res = null;
        res = new BufferedImage(rect_des.width, rect_des.height,BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = res.createGraphics();
        // transform(这里先平移、再旋转比较方便处理；绘图时会采用这些变化，绘图默认从画布的左上顶点开始绘画，源图片的左上顶点与画布左上顶点对齐，然后开始绘画，修改坐标原点后，绘画对应的画布起始点改变，起到平移的效果；然后旋转图片即可)

         //平移（原理修改坐标系原点，绘图起点变了，起到了平移的效果，如果作用于旋转，则为旋转中心点）
        g2.translate((rect_des.width - src_width) / 2, (rect_des.height - src_height) / 2);


        //旋转（原理transalte(dx,dy)->rotate(radians)->transalte(-dx,-dy);修改坐标系原点后，旋转90度，然后再还原坐标系原点为(0,0),但是整个坐标系已经旋转了相应的度数 ）
        g2.rotate(Math.toRadians(angel), src_width / 2, src_height / 2);

//        //先旋转（以目标区域中心点为旋转中心点，源图片左上顶点对准目标区域中心点，然后旋转）
//        g2.translate(rect_des.width/2,rect_des.height/ 2);
//        g2.rotate(Math.toRadians(angel));
//        //再平移（原点恢复到源图的左上顶点处（现在的右上顶点处），否则只能画出1/4）
//        g2.translate(-src_width/2,-src_height/2);

        g2.drawImage(src, null, null);
        return res;
    }

    /**
     * 计算转换后目标矩形的宽高
     * @param src 源矩形
     * @param angel 角度
     * @return 目标矩形
     */
    private static Rectangle calcRotatedSize(Rectangle src, int angel) {
        double cos = Math.abs(Math.cos(Math.toRadians(angel)));
        double sin = Math.abs(Math.sin(Math.toRadians(angel)));
        int des_width = (int)(src.width *  cos) + (int)(src.height * sin);
        int des_height =  (int)(src.height *  cos) + (int)(src.width * sin);
        return new java.awt.Rectangle(new Dimension(des_width, des_height));
    }

    /**
     * 获取图片旋转角度
     *
     * @param picFile 上传图片
     * @return
     */
    public static int getAngle(File picFile) throws ImageProcessingException, IOException {
        Metadata metadata = ImageMetadataReader.readMetadata(picFile);
        for (Directory directory : metadata.getDirectories()) {
            for (Tag tag : directory.getTags()) {
                if ("Orientation".equals(tag.getTagName())) {//ExifDirectoryBase.TAG_ORIENTATION
                    String orientation = tag.getDescription();
                    if (orientation.contains("90")) {
                        return 90;
                    } else if (orientation.contains("180")) {
                        return 180;
                    } else if (orientation.contains("270")) {
                        return 270;
                    }
                }
            }
        }

        return 0;
    }

    public static void main(String[] args) throws IOException {
//        System.out.println(HtmlUtil.escape(ss));
//        zoomImage("E:\\ztest\\long.jpg","E:\\ztest\\long_z.jpg");
//        zoomImage("E:\\ztest\\159.jpg","E:\\ztest\\159_d.jpg");
//        zoomImage("E:\\ztest\\9a92736b751b4658885a3f3c3af961e9_original.png","E:\\ztest\\9a92736b751b4658885a3f3c3af961e9_s.png");
//        zoomBigImage("E:\\ztest\\1.jpeg","E:\\ztest\\1_b.jpeg");
        zoomBigImage("E:\\ztest\\long.jpg","E:\\ztest\\long_b.jpg");
    }
}
