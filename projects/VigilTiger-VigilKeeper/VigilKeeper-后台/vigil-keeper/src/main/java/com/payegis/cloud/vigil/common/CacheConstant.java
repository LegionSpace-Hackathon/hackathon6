package com.payegis.cloud.vigil.common;

public interface CacheConstant {
    long EXPIRE_ONE_WEEK = 7*24*60;
    long EXPIRE_ONE_DAY = 24*60;
    long EXPIRE_MINUTE = 2*24*60;
    String REDIS_KEY_PRE = "ViGIL-KEEPER-";
}
