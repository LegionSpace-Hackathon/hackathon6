package com.payegis.cloud.vigil.vo;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;

@Data
public class MessageVo {

    private String messageId;
    private String content;
    private String conversationId;
    private String newName;
    private String taskId;
    private String msg;
    private String userId;
    private String fileId;
    private String extension;
    private String fileName;
    private JSONObject inputs = new JSONObject();
    private String language;
}
