package com.payegis.cloud.vigil.core.configure;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties("es")
public class EsConfig {

    private String uris;
    private String account;
    private String pwd;
    private String index;
}
