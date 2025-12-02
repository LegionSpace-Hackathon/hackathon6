package com.payegis.cloud.vigil.job;

import com.payegis.cloud.vigil.service.MessageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
@Slf4j
public class MessageJob {

    @Resource
    private MessageService messageService;


    //@Scheduled(cron = "0 */3 * * * ?")
    protected void executeAlert() {
        log.info("============定时发提醒消息==开始==========");
        messageService.sendAlert();
        log.info("============定时发提醒消息==结束==========");
    }


    //@Scheduled(cron = "0 */5 * * * ?")
    protected void executeConfirm() {
        log.info("============定时发确认消息==开始==========");
        messageService.sendConfirm();
        log.info("============定时发确认消息==结束==========");
    }

}
