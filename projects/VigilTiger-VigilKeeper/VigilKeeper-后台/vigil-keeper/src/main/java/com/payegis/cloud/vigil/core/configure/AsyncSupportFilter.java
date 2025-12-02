package com.payegis.cloud.vigil.core.configure;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
public class AsyncSupportFilter {

    /**
     * 注册异步请求过滤器的 Bean
     * @return FilterRegistrationBean 过滤器注册对象
     */
    @Bean
    public FilterRegistrationBean<AsyncRequestFilter> asyncFilterRegistration() {
        // 创建过滤器注册对象
        FilterRegistrationBean<AsyncRequestFilter> registration = new FilterRegistrationBean<>();
        // 设置使用的过滤器
        registration.setFilter(new AsyncRequestFilter());
        // 设置过滤器匹配的 URL 模式，/*表示匹配所有请求
        registration.addUrlPatterns("/*");
        // 启用异步支持
        registration.setAsyncSupported(true);
        // 设置过滤器的优先级为最高
        registration.setOrder(FilterRegistrationBean.HIGHEST_PRECEDENCE);
        return registration;
    }

    /**
     * 异步请求过滤器实现类
     * 继承 OncePerRequestFilter 确保每个请求只经过一次过滤器
     */
    private static class AsyncRequestFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            // 设置请求属性，启用 Tomcat 的异步处理支持
            request.setAttribute("org.apache.catalina.ASYNC_SUPPORTED", true);
            // 继续执行过滤器链
            chain.doFilter(request, response);
        }
    }
}
