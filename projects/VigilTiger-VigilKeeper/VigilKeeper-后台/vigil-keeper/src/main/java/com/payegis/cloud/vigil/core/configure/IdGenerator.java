package com.payegis.cloud.vigil.core.configure;

import com.payegis.cloud.vigil.utils.order.OrderUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.support.atomic.RedisAtomicLong;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Objects;
import java.util.Random;
import java.util.concurrent.TimeUnit;

/**
 * 分布式架构获取唯一订单号
 */
@Component
public class IdGenerator {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     *
     * @param key redis key
     * @return
     */
    public String generateOrderNo(String key) {
        try {
            // 生成14位的时间戳(每秒使用新的时间戳当key)
            String timeStamp = OrderUtil.getTranTime(new Date());
            // 获得redis-key
            String newKey = String.format("%s:%s",key,timeStamp);
            // 获取自增值（时间戳+自定义key）
            RedisAtomicLong counter = new RedisAtomicLong(newKey, Objects.requireNonNull(redisTemplate.getConnectionFactory()));
            // 设置时间戳生成的key的有效期为3s
            counter.expire(24, TimeUnit.HOURS);
            long orderNo = counter.incrementAndGet();
            // 获取订单号，时间戳 + 唯一自增Id( 6位数,不过前方补0)
            return timeStamp + String.format("%06d", orderNo);
        } catch (Exception e) {
            // redis 宕机时采用时间戳加随机数
            String timeStamp = OrderUtil.getTranTime(new Date());
            Random random = new Random();
            //14位时间戳 + 6位随机数
            timeStamp +=(random.nextInt(10)+"") + (random.nextInt(10)+"") + (random.nextInt(10)+"");
            timeStamp +=(random.nextInt(10)+"") + (random.nextInt(10)+"") + (random.nextInt(10)+"");
            return timeStamp;
        }
    }
}
