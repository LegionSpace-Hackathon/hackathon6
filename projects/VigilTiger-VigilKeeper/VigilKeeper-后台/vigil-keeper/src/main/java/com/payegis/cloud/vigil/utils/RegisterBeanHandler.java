package com.payegis.cloud.vigil.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class RegisterBeanHandler implements ApplicationContextAware {

    ConfigurableApplicationContext configurableApplicationContext;
    ApplicationContext applicationContext;

    @Autowired
    public RegisterBeanHandler(ConfigurableApplicationContext configurableApplicationContext) {
        this.configurableApplicationContext = configurableApplicationContext;
    }

    public <T> void registerBean(String beanName, T bean) {
        configurableApplicationContext.getBeanFactory().registerSingleton(beanName, bean);
    }

    public void unregisterBean(String beanName) {
        ((DefaultListableBeanFactory) configurableApplicationContext.getBeanFactory()).removeBeanDefinition(beanName);
    }

    public <T> T getBean(String beanName, Class<T> t) {
        return configurableApplicationContext.getBean(beanName, t);
    }

    public boolean containsBean(String beanName) {
        return configurableApplicationContext.containsBean(beanName);
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }
}
