package com.payegis.cloud.vigil.core.configure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class SensitiveWord {

    public List<String> WORDS = new ArrayList<>();

    @PostConstruct
    void init() {
        InputStream inputStream=null;
        BufferedReader bufferedReader=null;
        try {
            String resourceName = "/SensitiveWord.txt";
            inputStream = SensitiveWord.class.getResourceAsStream(resourceName);
            bufferedReader = new BufferedReader(new InputStreamReader(inputStream));

            String str = null;
            while((str = bufferedReader.readLine()) != null) {
                WORDS.add(str);
            }


        } catch (IOException e) {
            log.error("", e);
        }finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (bufferedReader != null) {
                    bufferedReader.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public String replace(String source) {
        for(String word : WORDS) {
            source = source.replace(word,"****");
        }
        return source;
    }

    public boolean check(String source) {
        for(String word : WORDS) {
            if(source.contains(word)) {
                log.info("SensitiveWord:{}",word);
                return true;
            }
        }
        return false;
    }
}
