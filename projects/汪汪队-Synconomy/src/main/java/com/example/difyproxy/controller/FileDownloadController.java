package com.example.difyproxy.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.logging.Logger;

@RestController
@RequestMapping("/v1")
public class FileDownloadController {

    private static final Logger logger = Logger.getLogger(FileDownloadController.class.getName());

    // 电商支付模板文件路径
    private static final String ECOMMERCE_PAYMENT_TEMPLATE_PATH = "data/电商支付模板.xlsx";

    /**
     * 下载电商支付模板表格文件
     * @return ResponseEntity<Resource> 文件资源响应
     */
    @GetMapping("/download/ecommerce-payment-template")
    public ResponseEntity<Resource> downloadEcommercePaymentTemplate() {
        try {
            // 获取项目根目录路径
            String projectRoot = System.getProperty("user.dir");
            Path filePath = Paths.get(projectRoot, ECOMMERCE_PAYMENT_TEMPLATE_PATH);

            logger.info("尝试下载文件: " + filePath.toString());

            // 检查文件是否存在
            if (!Files.exists(filePath)) {
                logger.warning("文件不存在: " + filePath.toString());
                return ResponseEntity.notFound().build();
            }

            // 创建文件资源
            File file = filePath.toFile();
            Resource resource = new FileSystemResource(file);

            // 检查资源是否可读
            if (!resource.isReadable()) {
                logger.warning("文件不可读: " + filePath.toString());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");

            logger.info("文件下载成功: " + file.getName() + ", 大小: " + file.length() + " bytes");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(file.length())
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);

        } catch (Exception e) {
            logger.severe("下载文件时发生错误: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
