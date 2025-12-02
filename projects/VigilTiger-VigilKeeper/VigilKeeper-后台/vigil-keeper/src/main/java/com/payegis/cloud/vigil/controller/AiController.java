package com.payegis.cloud.vigil.controller;

import com.alibaba.fastjson.JSONObject;
import com.payegis.cloud.vigil.core.ret.RetResponse;
import com.payegis.cloud.vigil.core.ret.RetResult;
import com.payegis.cloud.vigil.entity.User;
import com.payegis.cloud.vigil.service.AiService;
import com.payegis.cloud.vigil.service.FileService;
import com.payegis.cloud.vigil.service.MessageService;
import com.payegis.cloud.vigil.service.UserService;
import com.payegis.cloud.vigil.utils.CommonStringUtil;
import com.payegis.cloud.vigil.utils.FileNameUtil;
import com.payegis.cloud.vigil.vo.MessageVo;
import io.github.imfangs.dify.client.model.chat.Conversation;
import io.github.imfangs.dify.client.model.chat.ConversationListResponse;
import io.github.imfangs.dify.client.model.chat.MessageListResponse;
import io.github.imfangs.dify.client.model.file.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.payegis.cloud.vigil.common.CommonConstant.SEP_POINT;

@CrossOrigin(origins = "*")
@Slf4j
@RestController
@RequestMapping(value = "/ai")
public class AiController extends BaseController {

    @Value("${file.path}")
    private String filePath;

    @Resource
    private AiService aiService;
    @Resource
    private FileService fileService;
    @Autowired
    private UserService userService;
    @Autowired
    private MessageService messageService;


    @RequestMapping(value = "/files/upload")
    public RetResult upload(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String userId = getUserId(request);
        String fileName = FileNameUtil.replaceAsterisk(file.getOriginalFilename());
        String newFileName = StringUtils.substringBefore(fileName,SEP_POINT)+ "_" +System.currentTimeMillis()
                + fileName.substring(fileName.lastIndexOf(SEP_POINT));
        String tmpFilePath = filePath + newFileName;
        try {
            file.transferTo(new File(tmpFilePath));
        } catch (IOException e) {
            log.error("",e);
        }
        try {
            FileUploadResponse response = aiService.uploadFile(new File(tmpFilePath),userId);
            fileService.save(userId,response.getId(),fileName);
            return RetResponse.makeOKRsp(response);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("上传异常，稍后再试");
        }
    }

    @RequestMapping(value = "/chat-messages",produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody MessageVo vo, HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            if(StringUtils.isNotBlank(vo.getFileId()) && StringUtils.isNotBlank(vo.getFileName())) {
                String localFilePath = aiService.downloadFromChain(userId,vo.getFileId(),vo.getFileName());
                FileUploadResponse response = aiService.uploadFile(new File(localFilePath),userId);

                vo.setFileName(null);
                vo.setFileId(response.getId());
                vo.setExtension(response.getExtension());
            }
            vo.setLanguage(request.getHeader("language"));
            User user = userService.queryUserByUserId(userId);
            if(user != null) {
                vo.getInputs().put("mobile",user.getMobile());
            }
            return aiService.chat(vo,userId);
        } catch (Exception e) {
            log.error("",e);
            return null;
        }
    }

    @RequestMapping(value = "/getContract")
    public RetResult getContract(@RequestBody JSONObject paraJson,HttpServletRequest request) {
        try {
            User user = userService.queryUserByMobile(paraJson.getString("mobile"));
            String userId = user.getUserId();
            List<Map<String,Object>> list = aiService.getContract(userId,paraJson.getString("contractNumber"));
            return RetResponse.makeOKRsp(list);
        } catch (Exception e) {
            log.error("getContract error",e);
            return RetResponse.makeErrRsp("服务异常，稍后再试");
        }
    }

    @RequestMapping(value = "/addContract")
    public RetResult addContract(@RequestBody JSONObject paraJson,HttpServletRequest request) {
        try {
            User user = userService.queryUserByMobile(paraJson.getString("mobile"));
            String userId = user.getUserId();
            aiService.addContract(userId,paraJson);
            return RetResponse.makeOKRsp();
        } catch (Exception e) {
            log.error("addContract error",e);
            return RetResponse.makeErrRsp("服务异常，稍后再试");
        }
    }

    @RequestMapping(value = "/confirmContract")
    public RetResult confirmContract(@RequestBody JSONObject paraJson,HttpServletRequest request) {
        try {
            aiService.conformContract(paraJson.getLong("id"));
            return RetResponse.makeOKRsp();
        } catch (Exception e) {
            log.error("addContract error",e);
            return RetResponse.makeErrRsp("服务异常，稍后再试");
        }
    }

    @RequestMapping(value = "/getConfirmStatus")
    public RetResult getConfirmStatus(@RequestBody JSONObject paraJson,HttpServletRequest request) {
        try {
            int status = aiService.getConfirmStatus(paraJson.getLong("id"));
            return RetResponse.makeOKRsp(status);
        } catch (Exception e) {
            log.error("getConfirmStatus error",e);
            return RetResponse.makeErrRsp("服务异常，稍后再试");
        }
    }


    @RequestMapping(value = "/stopChatMessage/{taskId}")
    public RetResult stopChatMessage(@PathVariable("taskId") String taskId,HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            String result = aiService.stopChatMessage(taskId,userId);
            return RetResponse.makeOKRsp(result);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("停止响应异常，稍后再试");
        }
    }

    @RequestMapping(value = "/feedbackMessage")
    public RetResult feedbackMessage(@RequestBody MessageVo vo,HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            String result = aiService.feedbackMessage(vo.getMessageId(),vo.getContent(),userId);
            return RetResponse.makeOKRsp(result);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("消息反馈（点赞）异常，稍后再试");
        }
    }

    @RequestMapping(value = "/getMessages/{conversationId}")
    public RetResult getMessages(@PathVariable("conversationId") String conversationId,HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            MessageListResponse messages = aiService.getMessages(conversationId,userId);
            return RetResponse.makeOKRsp(messages);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("获取会话历史消息异常，稍后再试");
        }
    }

    @RequestMapping(value = "/getConversations")
    public RetResult getConversations(HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            ConversationListResponse conversations = aiService.getConversations(userId);
            return RetResponse.makeOKRsp(conversations);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("获取会话列表异常，稍后再试");
        }
    }

    @RequestMapping(value = "/delConversation/{conversationId}")
    public RetResult delConversation(@PathVariable("conversationId") String conversationId, HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            String result = aiService.deleteConversation(conversationId,userId);
            return RetResponse.makeOKRsp(result);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("删除会话异常，稍后再试");
        }
    }

    @RequestMapping(value = "/renameConversation")
    public RetResult renameConversation(@RequestBody MessageVo vo, HttpServletRequest request) {
        String userId = getUserId(request);
        try {
            Conversation conversation = aiService.renameConversation(vo.getConversationId(),vo.getNewName(),userId);
            return RetResponse.makeOKRsp(conversation);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("删除会话异常，稍后再试");
        }
    }

    @RequestMapping(value = "/audioToText")
    public RetResult audioToText(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String userId = getUserId(request);
        String fileName = FileNameUtil.replaceAsterisk(file.getOriginalFilename());
        String tmpFilePath = filePath + CommonStringUtil.get32UUID()+fileName.substring(fileName.lastIndexOf(SEP_POINT));
        try {
            file.transferTo(new File(tmpFilePath));
        } catch (IOException e) {
            log.error("",e);
        }
        try {
            String text = aiService.audioToText(new File(tmpFilePath),userId);
            return RetResponse.makeOKRsp(text);
        } catch (Exception e) {
            log.error("",e);
            return RetResponse.makeErrRsp("上传异常，稍后再试");
        }
    }

    @RequestMapping(value = "/downloadFile")
    public void downloadFile(String fileUrl, HttpServletRequest request,HttpServletResponse response) {
        String fileName = getFileName(fileUrl);
        try (InputStream inputStream = new FileInputStream(filePath+fileName);
             OutputStream outputStream = response.getOutputStream()) {
            String newName = "催款函."+StringUtils.substringAfterLast(fileName,".");
            FileNameUtil.encodeFileName(newName,request,response);
            byte[] buffer = new byte[1024];
            for (int n; (n = inputStream.read(buffer)) != -1; ) {
                outputStream.write(buffer, 0, n);
            }
            outputStream.flush();
        } catch (Exception e) {
            log.error("下载异常:{}",e.getMessage());
        }
    }

    @RequestMapping(value = "/previewFile")
    public RetResult previewFile(String fileUrl, HttpServletRequest request) {
        String userId = getUserId(request);
        log.info("previewFile userId:{} fileUrl:{}",userId,fileUrl);
        String fileName = getFileName(fileUrl);
        String url = aiService.getChainFileUrl(userId,fileName);
        log.info("previewFile chain url:{} fileName:{}",url,fileName);
        if(StringUtils.isBlank(url)) {
            return RetResponse.makeErrRsp("URL不存在");
        }
        return RetResponse.makeOKRsp(url);
    }

    @RequestMapping(value = "/viewMessages/{conversationId}")
    public RetResult viewMessages(@PathVariable("conversationId") String conversationId,HttpServletRequest request) {
        String userId = getUserIdByHead(request);
        String shareUserId = getUserIdFromShare(request);
        log.info("share userId:{},shareUserId:{},conversationId:{}",userId,shareUserId,conversationId);
        try {
            Map<String,Object> dataMap = new HashMap<>();
            MessageListResponse messages = aiService.getMessages(conversationId,shareUserId);
            dataMap.put("messages",messages);
            dataMap.put("self",shareUserId.equals(userId));
            return RetResponse.makeOKRsp(dataMap);
        } catch (Exception e) {
            log.error("viewMessages error:{}",shareUserId,e);
            return RetResponse.makeErrRsp("查看分享会话消息异常，稍后再试");
        }
    }

    @RequestMapping(value = "/testMsg/{type}")
    public RetResult testMsg(@PathVariable("type") String type,String mobile,Long id,HttpServletRequest request) {
        try {
            if("alert".equals(type)) {
                messageService.sendAlert(mobile,id);
            }else {
                messageService.sendConfirm(id);
            }

            return RetResponse.makeOKRsp();
        } catch (Exception e) {
            return RetResponse.makeErrRsp("消息异常，稍后再试");
        }
    }

    private String getFileName(String fileUrl) {
        String fileName = fileUrl.contains("/")?StringUtils.substringAfterLast(fileUrl,"/"):fileUrl;
        return StringUtils.substringBefore(fileName,"?");
    }

}

