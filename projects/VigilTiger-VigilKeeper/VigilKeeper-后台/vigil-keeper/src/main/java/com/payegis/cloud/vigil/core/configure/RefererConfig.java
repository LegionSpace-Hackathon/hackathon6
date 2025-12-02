package com.payegis.cloud.vigil.core.configure;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class RefererConfig implements WebMvcConfigurer  {

    @Bean
    public RefererInterceptor refererInterceptor(){
        return new RefererInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        InterceptorRegistration registration = registry.addInterceptor(refererInterceptor());
        registration.addPathPatterns("/news/detail/*");
    }
}
