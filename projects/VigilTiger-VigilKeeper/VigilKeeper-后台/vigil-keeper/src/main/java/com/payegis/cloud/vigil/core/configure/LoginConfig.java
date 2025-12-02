package com.payegis.cloud.vigil.core.configure;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//@Configuration
public class LoginConfig implements WebMvcConfigurer  {

    @Bean
    public LocaleInterceptor localeInterceptor(){
        return new LocaleInterceptor();
    }

    @Bean
    public LoginInterceptor loginInterceptor(){
        return new LoginInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeInterceptor()).addPathPatterns("/**","");

        InterceptorRegistration registration = registry.addInterceptor(loginInterceptor());
        registration.addPathPatterns("/**","");
        registration.excludePathPatterns("/auth/**","/getIcon/*","/ai/**"
        );
    }
}
