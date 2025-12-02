package com.payegis.cloud.vigil.service.ip;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;

import javax.annotation.PostConstruct;
import java.io.File;

@Service
@Slf4j
public class IpService {

    private Searcher searcher;

    @PostConstruct
    void init() {

        // 1、从 dbPath 加载整个 xdb 到内存。
        String dbPath="";
        byte[] cBuff;
        try {
            File file = ResourceUtils.getFile(ResourceUtils.CLASSPATH_URL_PREFIX+"ip2region.xdb");
            dbPath = file.getPath();
            cBuff = Searcher.loadContentFromFile(file.getPath());
        } catch (Exception e) {
            log.info("failed to load content from {}: %s\n", dbPath, e);
            return;
        }

        // 2、使用上述的 cBuff 创建一个完全基于内存的查询对象。
        try {
            searcher = Searcher.newWithBuffer(cBuff);
        } catch (Exception e) {
            log.info("failed to create content cached searcher: %s\n", e);
        }
    }

    public String getRegion(String ip) {
        if(StringUtils.isBlank(ip)) {
            return "未知";
        }
        try {
            String region = searcher.searchByStr(ip);
            log.info("{} region:{}",ip,region);
            if(region.contains("内网")) {
                return "未知";
            }
            String[] regions = region.split("\\|");
            if("中国".equals(regions[0])) {
                String province = regions[2];
                province = province.replace("省","")
                        .replace("市","");
                return province;
            }else {
                return regions[0];
            }
        } catch (Exception e) {
            log.error("getRegion error",e);
            return "未知";
        }
    }
}
