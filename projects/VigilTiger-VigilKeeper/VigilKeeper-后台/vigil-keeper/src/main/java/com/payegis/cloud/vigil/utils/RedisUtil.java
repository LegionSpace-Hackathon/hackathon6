package com.payegis.cloud.vigil.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

import static com.payegis.cloud.vigil.common.CacheConstant.REDIS_KEY_PRE;

@Component
public class RedisUtil {
    @Value("${token.expired.hour}")
    private int tokenExpiredHour;

    @Resource
    private RedisTemplate redisTemplate;

    public void putToken(String key,Object value){
        redisTemplate.opsForValue().set(key,value,60*tokenExpiredHour, TimeUnit.MINUTES);
    }

    public Object getToken(String key){
        return redisTemplate.opsForValue().get(key);
    }

    public boolean exist(String key){
        return redisTemplate.hasKey(key);
    }

    public void deleteToken(String key){
        redisTemplate.delete(key);
    }

    public void putValue(String key,Object value,long minutes){
        redisTemplate.opsForValue().set(key,value,minutes,TimeUnit.MINUTES);
    }

    public void putValue(String key,Object value){
        redisTemplate.opsForValue().set(key,value);
    }

    public Object getValue(String key){
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteKey(String key){
        redisTemplate.delete(key);
    }

    public void incrValue(String key){
        redisTemplate.opsForValue().increment(key);
    }

    public long incrValue(String key, int cacheSeconds) {
        long result = redisTemplate.opsForValue().increment(key);
        if (result<=1 && cacheSeconds != 0) {
            redisTemplate.expire(key, cacheSeconds,TimeUnit.SECONDS);
        }
        return result;
    }

    public long incrValueOneMinute(String key) {
        return incrValue(key,60);
    }

    public String buildKey(String itemType,Object item) {
        return REDIS_KEY_PRE+itemType+item;
    }

    public String buildKey(String itemType,String userId,Object itemId) {
        return buildKey(itemType,userId,itemId,null);
    }

    public String buildKey(String itemType,String userId,Object itemId,Object childItemId) {
        String redisKey = REDIS_KEY_PRE+itemType+userId+"-"+itemId;
        if(childItemId != null) {
            redisKey = redisKey+"-"+childItemId;
        }
        return redisKey;
    }


}
