package com.payegis.cloud.vigil.utils;


import javax.activation.DataHandler;
import javax.activation.FileDataSource;
import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import java.io.File;
import java.util.Date;
import java.util.Properties;

public class MailUtil {

    // 邮件发送协议
    private final static String PROTOCOL = "smtp";

    // SMTP邮件服务器
    private final static String HOST = "mail.tongfudun.com";

    // SMTP邮件服务器默认端口
    private final static String PORT = "587";

    // 是否要求身份认证
    private final static String IS_AUTH = "true";

    // 是否启用调试模式（启用调试模式可打印客户端与服务器交互过程时一问一答的响应消息）
    private final static String IS_ENABLED_DEBUG_MOD = "true";

    // 收件人

    // 初始化连接邮件服务器的会话信息
    private static Properties props = null;

    static {
        props = new Properties();
        props.setProperty("mail.transport.protocol", PROTOCOL);
        props.setProperty("mail.smtp.host", HOST);
        props.setProperty("mail.smtp.port", PORT);
        props.setProperty("mail.smtp.auth", IS_AUTH);
    }

    /**
     * 发送简单的html邮件
     */
    public static void sendHtmlEmail(String subject, String htmlContent,String toMails,String from,String verification_code) throws MessagingException {
        // 创建Session实例对象
        Session session = Session.getInstance(props);
        // 创建MimeMessage实例对象
        MimeMessage message = new MimeMessage(session);
        // 设置邮件主题
        message.setSubject(subject);
        // 设置发送人
        message.setFrom(new InternetAddress(from+"@tongfudun.com"));
        // 设置发送时间
        message.setSentDate(new Date());
        // 设置收件人
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toMails));
        // 设置html内容为邮件正文，指定MIME类型为text/html类型，并指定字符编码为gbk
        message.setContent(htmlContent, "text/html;charset=UTF-8");

        // 保存并生成最终的邮件内容
        message.saveChanges();
        Transport transport = session.getTransport();
        transport.connect(from, verification_code);
        // 发送邮件
        transport.sendMessage(message,message.getAllRecipients());
        transport.close();
    }

    /**
     * 发送简单的html邮件
     */
    public static void sendHtmlEmailWithImg(String subject, String htmlContent, String toMails, File imgFile,String contentId ,String from, String verification_code) throws MessagingException {
        // 创建Session实例对象
        Session session = Session.getInstance(props);

        // 创建MimeMessage实例对象
        MimeMessage message = new MimeMessage(session);

        MimeBodyPart image = new MimeBodyPart();
        // 读取本地文件
        DataHandler dh = new DataHandler(new FileDataSource(imgFile));
        // 将图片数据添加到"节点"
        image.setDataHandler(dh);
        // 为"节点"设置一个唯一编号（在文本"节点"将引用该ID）
        image.setContentID("mailInvitePic");

        // 6. 创建文本"节点"
        MimeBodyPart text = new MimeBodyPart();
        // 这里添加图片的方式是将整个图片包含到邮件内容中, 实际上也可以以 http 链接的形式添加网络图片
        text.setContent(htmlContent, "text/html;charset=UTF-8");

        // 7. （文本+图片）设置 文本 和 图片"节点"的关系（将 文本 和 图片"节点"合成一个混合"节点"）
        MimeMultipart mm_text_image = new MimeMultipart();
        mm_text_image.addBodyPart(text);
        mm_text_image.addBodyPart(image);
        mm_text_image.setSubType("related"); // 关联关系

        // 8. 将 文本+图片 的混合"节点"封装成一个普通"节点"
        // 最终添加到邮件的 Content 是由多个 BodyPart 组成的 Multipart, 所以我们需要的是 BodyPart,
        // 上面的 mailTestPic 并非 BodyPart, 所有要把 mm_text_image 封装成一个 BodyPart

        // 设置邮件主题
        message.setSubject(subject);
        // 设置发送人
        message.setFrom(new InternetAddress(from+"@tongfudun.com"));
        // 设置发送时间
        message.setSentDate(new Date());
        // 设置收件人
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toMails));
        // 设置html内容为邮件正文，指定MIME类型为text/html类型，并指定字符编码为gbk
        message.setContent(mm_text_image);

        // 保存并生成最终的邮件内容
        message.saveChanges();
        Transport transport = session.getTransport();
        transport.connect(from, verification_code);
        // 发送邮件
        transport.sendMessage(message,message.getAllRecipients());
        transport.close();
    }


}
