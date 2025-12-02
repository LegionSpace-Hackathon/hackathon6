package com.example.difyproxy.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.web.reactive.config.WebFluxConfigurer;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

/**
 * WebFlux配置类
 * 配置multipart文件上传支持
 */
@Configuration
public class WebFluxConfig implements WebFluxConfigurer {

    /**
     * 配置multipart消息读取器
     * 支持大文件上传和多种文件类型
     */
    @Bean
    public MultipartHttpMessageReader multipartHttpMessageReader() {
        DefaultPartHttpMessageReader partReader = new DefaultPartHttpMessageReader();
        // 设置最大内存大小 (10MB)
        partReader.setMaxInMemorySize(10 * 1024 * 1024);
        // 设置最大磁盘使用量 (100MB)
        partReader.setMaxDiskUsagePerPart(100 * 1024 * 1024);
        // 设置最大头大小 (8KB)
        partReader.setMaxHeadersSize(8 * 1024);
        
        return new MultipartHttpMessageReader(partReader);
    }
}
