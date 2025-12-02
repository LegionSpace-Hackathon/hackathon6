package com.payegis.cloud.vigil.service;

import cn.hutool.core.io.IoUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payegis.cloud.vigil.core.configure.DifyProperty;
import com.payegis.cloud.vigil.dto.ChatMessageDto;
import com.payegis.cloud.vigil.entity.User;
import com.payegis.cloud.vigil.entity.VigilFile;
import com.payegis.cloud.vigil.mapper.VigilFileMapper;
import com.payegis.cloud.vigil.utils.ThreadUtil;
import com.payegis.cloud.vigil.utils.WSUtil;
import com.payegis.cloud.vigil.vo.MessageVo;
import com.sun.jersey.api.client.ClientResponse;
import io.github.imfangs.dify.client.DifyClient;
import io.github.imfangs.dify.client.DifyClientFactory;
import io.github.imfangs.dify.client.callback.ChatStreamCallback;
import io.github.imfangs.dify.client.callback.CompletionStreamCallback;
import io.github.imfangs.dify.client.enums.FileTransferMethod;
import io.github.imfangs.dify.client.enums.FileType;
import io.github.imfangs.dify.client.enums.ResponseMode;
import io.github.imfangs.dify.client.event.ErrorEvent;
import io.github.imfangs.dify.client.event.MessageEndEvent;
import io.github.imfangs.dify.client.event.MessageEvent;
import io.github.imfangs.dify.client.exception.DifyApiException;
import io.github.imfangs.dify.client.model.chat.*;
import io.github.imfangs.dify.client.model.common.SimpleResponse;
import io.github.imfangs.dify.client.model.completion.CompletionRequest;
import io.github.imfangs.dify.client.model.completion.CompletionResponse;
import io.github.imfangs.dify.client.model.file.FileInfo;
import io.github.imfangs.dify.client.model.file.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static com.payegis.cloud.vigil.common.CommonConstant.SEP_POINT;

@Service
@Slf4j
public class AiService {
    //https://github.com/imfangs/dify-java-client?tab=readme-ov-file

    @Value("${file.path}")
    private String filePath;
    @Value("${spring.profiles.active}")
    private String environment;
    @Resource
    private DifyProperty difyProperty;
    @Resource
    private RestTemplate restTemplate;
    @Resource
    private ChainApiService chainApiService;
    @Resource
    private VigilFileMapper vigilFileMapper;
    @Resource
    private UserService userService;

    private DifyClient client;
    @Autowired
    private FileService fileService;

    @PostConstruct
    void init() {
        // 创建完整的 Dify 客户端
        client = DifyClientFactory.createClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());
    }

    public SseEmitter chat(MessageVo vo, String userId) {
        String urlAddr = difyProperty.getDifyUrl()+"/chat-messages";

        //ChatMessageDto dto = buildDto(vo,userId);
        // 使用线程池处理异步任务
        ExecutorService executor = Executors.newSingleThreadExecutor();
        // 创建 SSE Emitter，设置超时时间（例如 5 分钟）
        SseEmitter emitter = new SseEmitter(300_000L);
        executor.execute(() -> {
            BufferedReader reader = null;
            DataOutputStream out = null;
            try {
                URL url = new URL(urlAddr);
                // 建立链接
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Accept", "text/event-stream");
                connection.setRequestProperty("Content-type", "application/json; charset=UTF-8");
                connection.setRequestProperty("Connection", "keep-alive");
                connection.setRequestProperty("Authorization", "Bearer "+difyProperty.getDifyKey());
                // 允许输入和输出
                connection.setDoInput(true);
                connection.setDoOutput(true);
                // 设置超时为0，表示无限制
                connection.setConnectTimeout(0);
                connection.setReadTimeout(0);
                // 传参
                JSONObject paraJson = buildPara(vo,userId);
                // 写入POST数据
                out = new DataOutputStream(connection.getOutputStream());
                out.write(paraJson.toJSONString().getBytes(StandardCharsets.UTF_8));
                out.flush();
                out.close();

                // 读取SSE事件
                reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
                String line;
                while ((line = reader.readLine()) != null) {
                    line = StringUtils.substringAfter(line,"data:");
                    emitter.send(SseEmitter.event().data(line));
                    String finalLine = line;
//                    downloadFileForChat(finalLine,userId);
                    ThreadUtil.start(() -> downloadFileForChat(finalLine,userId));

                }
                emitter.complete();
                reader.close();
                // 断开链接
                connection.disconnect();
            } catch (Exception e) {
                emitter.completeWithError(e);
                log.error("chat error",e);
            } finally {
                IoUtil.close(reader);
                IoUtil.close(out);
                log.info("对话结束...");
            }

        });
        // 关闭线程池
        executor.shutdown();
        log.info("对话完成...");
        return emitter;
    }

    private JSONObject buildPara(MessageVo vo,String userId) {
        JSONObject inputs = vo.getInputs();
        //inputs.put("language",vo.getLanguage());
        JSONObject paraJson = new JSONObject();
        paraJson.put("inputs",inputs);
        paraJson.put("response_mode","streaming");
        paraJson.put("query",vo.getMsg());
        paraJson.put("user",userId);
        paraJson.put("conversation_id",StringUtils.isBlank(vo.getConversationId()) ? "" : vo.getConversationId());

        JSONArray files = new JSONArray();
        if(StringUtils.isNotBlank(vo.getFileId())) {
            inputs.put("fileId",vo.getFileId());
            JSONObject file = new JSONObject();
            if(StringUtils.isBlank(vo.getFileName())) {
                file.put("type",FileType.getByFileExtension(vo.getExtension()));
                file.put("transfer_method",FileTransferMethod.LOCAL_FILE);
                file.put("upload_file_id",vo.getFileId());

            }else {
                file.put("type",FileType.getByFileExtension(vo.getFileName()));
                file.put("transfer_method",FileTransferMethod.REMOTE_URL);
                file.put("url",chainApiService.getFileUrl(vo.getFileId(),vo.getFileName()));
//            file.put("url",chainApiService.getFileUrlNoPic(vo.getFileId(),vo.getFileName()));

            }
            files.add(file);
        }
        if(!files.isEmpty()) {
            paraJson.put("files",files);
        }
        return paraJson;
    }

    private void saveResponseData(String userId,String fileId,String line) {
        if(StringUtils.isBlank(fileId) || StringUtils.isBlank(line)) {
            return;
        }

        JSONObject msgJson = JSON.parseObject(line);
        if(msgJson == null || msgJson.isEmpty()) {
            return;
        }
        String event = msgJson.getString("event");
        if("workflow_finished".equals(event)) {
            JSONObject data = msgJson.getJSONObject("data");
            if (data != null && !data.isEmpty()) {
                String answer = data.getJSONObject("outputs").getString("answer");
                answer = answer.replace("```json","").replace("```","");
                JSONObject answerJson = JSON.parseObject(answer);
                JSONObject infoJson = answerJson.getJSONObject("contract_info");
                boolean exist = saveContract(userId,fileId,infoJson);
                if(exist) {
                    return;
                }
                JSONArray timelines = answerJson.getJSONArray("detailed_timeline");
                saveContract(fileId,timelines);
            }
        }
    }

    private boolean saveContract(String userId,String fileId,JSONObject infoJson) {
        int count = vigilFileMapper.selectContractCount(fileId);
        if(count > 0) {
            return true;
        }

        Map<String,Object> map = new HashMap<>();
        map.put("fileId",fileId);
        map.put("userId",userId);
        map.put("contractName",infoJson.get("contract_name"));
        map.put("contractNumber",infoJson.get("contract_number"));
        map.put("signDate",infoJson.get("sign_date"));
        vigilFileMapper.insertContract(map);
        return false;
    }

    private void saveContract(String fileId,JSONArray timelines) {
        for(int i=0;i<timelines.size();i++) {
            JSONObject timeline = timelines.getJSONObject(i);
            Map<String,Object> map = new HashMap<>();
            map.put("fileId",fileId);
            map.put("lineDesc",timeline.get("description"));
            map.put("lineRelation",timeline.get("relation_to_sign_date"));
            map.put("lineDate",timeline.get("date"));
            vigilFileMapper.insertContractLine(map);
        }

    }

    public List<Map<String,Object>> getContract(String userId,String contractNumber) {
        List<Map<String,Object>> contracts = vigilFileMapper.selectContract(userId,contractNumber);
        for(Map<String,Object> map : contracts) {
            String fileId = map.get("file_id").toString();
            List<Map<String,Object>> timelines = vigilFileMapper.selectContractLine(fileId);
            map.put("timelines",timelines);
        }

        return contracts;
    }


    public void addContract(String userId,JSONObject paraJson) {
        log.info("addContract:{}",paraJson);
        String fileId = paraJson.getString("fileId");
        JSONObject data = paraJson.getJSONObject("data");
        if (data != null && !data.isEmpty()) {
            JSONObject infoJson = data.getJSONObject("contract_info");
            boolean exist = saveContract(userId,fileId,infoJson);
            if(exist) {
                return;
            }
            JSONArray timelines = data.getJSONArray("detailed_timeline");
            saveContract(fileId,timelines);
        }

    }

    public void conformContract(Long id) {
        vigilFileMapper.updateContractLineConfirmStatus(id);
    }

    public int getConfirmStatus(Long id) {
        Integer status = vigilFileMapper.getConfirmStatus(id);
        return status == null ? 1: status;
    }

    private void downloadFileForChat(String line,String userId) {
        JSONObject msgJson = JSON.parseObject(line);
        if(msgJson == null || msgJson.isEmpty()) {
            return;
        }
        String event = msgJson.getString("event");
        if("message_end".equals(event)) {
            JSONArray files = msgJson.getJSONArray("files");
            if (files != null && !files.isEmpty()) {
                files.forEach(file -> {
                    JSONObject fileJson = (JSONObject) file;
                    String url = fileJson.getString("url");
                    if(StringUtils.isNotBlank(url) || !url.contains("files/tools")) {
                        downloadFromDify(userId, url, fileJson.getString("filename"));
                    }

                });
            }
        }
    }

    private void downloadFromDify(String userId,String fileUrl,String fileName) {
        log.info("downloadFromDify:{}",fileUrl);
        String url = StringUtils.substringBeforeLast(difyProperty.getDifyUrl(),"/") + fileUrl;

        String localFileName = StringUtils.substringAfter(fileUrl,"tools/");
        localFileName = StringUtils.substringBefore(localFileName,"?");
        String localFile = filePath + localFileName;

        downloadToLocal(url,localFile);

        VigilFile vigilFile = new VigilFile();
        vigilFile.setFileName(fileName);
        vigilFile.setFilePath(localFileName);
        vigilFile.setUserId(userId);
        fileService.save(vigilFile);

       /* String previewUrl = getChainFileUrl(userId,localFileName);
        if(previewUrl == null) {
            uploadFileToChain(userId,localFile,fileName);
        }*/

    }

    public String downloadFromChain(String userId,String chainFileId,String chainFileName) {
        String url = chainApiService.getFileUrl(chainFileId,chainFileName);

        String localFileName = StringUtils.substringBefore(chainFileName,SEP_POINT)+ "_" +System.currentTimeMillis()
                + chainFileName.substring(chainFileName.lastIndexOf(SEP_POINT));
        String localFile = filePath+localFileName;
        downloadToLocal(url,localFile);
        saveChainFile(userId,localFileName,chainFileId,chainFileName);
        return localFile;
    }

    public JSONObject uploadFileToChain(String userId,String localFile,String chainFileName) {
        String localFileName = StringUtils.substringAfterLast(localFile,"/");
        User user = userService.queryUserByUserId(userId);
        if(user == null) {
            return null;
        }
        JSONObject dataJson = chainApiService.uploadFile(user.getMobile(),user.getEmail(),chainFileName,localFile);
        if(dataJson == null) {
            log.warn("uploadFileToChain fail, chainFileName:{}",chainFileName);
            return null;
        }
        saveChainFile(userId,localFileName,dataJson.getString("cid"),dataJson.getString("fileName"));

        return dataJson;
    }

    private void saveChainFile(String userId,String localFileName,String chainFileId,String chainFileName) {
        vigilFileMapper.insertChainFile(userId,localFileName,chainFileId,chainFileName);
    }

    public String getChainFileUrl(String userId,String localFileName) {
        Map<String,String> map = getChainFromDb(userId,localFileName);
        if(map == null) {
            return null;
        }
        return getChainPreviewUrl(map.get("chainFileId"),map.get("chainFileName"));
    }

    public String getChainPreviewUrl(String chainFileId,String chainFileName) {
        if("cloud".equals(environment)) {
            //return chainApiService.getFileUrlPreview0(map.get("chainFileId"),map.get("chainFileName"));
        }
        return chainApiService.getFileUrlPreview(chainFileId,chainFileName);
    }

    private boolean downloadToLocal(String url,String filePath) {
        log.info("downloadToLocal start filePath:{}",filePath);
        if(new File(filePath).exists()) {
            return true;
        }
        ClientResponse clientResponse = WSUtil.sendRequestGet(url);
        try (InputStream inputStream = clientResponse.getEntityInputStream();
             OutputStream outputStream = new FileOutputStream(filePath)) {
            byte[] buffer = new byte[1024];
            for (int n; (n = inputStream.read(buffer)) != -1; ) {
                outputStream.write(buffer, 0, n);
            }
            outputStream.flush();
        } catch (Exception e) {
            log.error("downloadToLocal error",e);
        }
        log.info("downloadToLocal success url:{}",url);
        return false;
    }

    public Map<String,String> getChainFromDb(String userId,String localFileName) {
        return vigilFileMapper.selectChainFile(userId,localFileName);
    }

    public FileUploadResponse uploadFile(File file,String userId) throws IOException, DifyApiException {
        return client.uploadFile(file,userId);
    }

    public String stopChatMessage(String taskId,String userId) throws IOException, DifyApiException {
        // 停止文本生成
        SimpleResponse stopResponse = client.stopChatMessage(taskId, userId);
        return stopResponse.getResult();
    }

    public String feedbackMessage(String messageId,String content,String userId) throws IOException, DifyApiException {
        // 发送消息反馈（点赞）
        SimpleResponse feedbackResponse = client.feedbackMessage(messageId, "like", userId, content);
        return feedbackResponse.getResult();
    }

    public MessageListResponse getMessages(String conversationId,String userId) throws IOException, DifyApiException {
        // 获取会话历史消息
        MessageListResponse messages = client.getMessages(conversationId, userId, null, 10);
        handleMsg(messages,userId);
        return messages;
    }

    private void handleMsg(MessageListResponse messages,String userId) {
        List<MessageListResponse.Message> data = messages.getData();
        if(data == null || data.isEmpty()) {
            return;
        }

        for(MessageListResponse.Message message : data) {
            List<MessageListResponse.MessageFile> files = message.getMessageFiles();
            if(files == null || files.isEmpty()) {
                continue;
            }
            for(MessageListResponse.MessageFile file : files) {
                String url = file.getUrl();
                if(StringUtils.isBlank(url) || !url.contains("files/tools")) {
                    continue;
                }
                downloadFromDify(userId,url,file.getFileName());
            }
        }
    }

    public ConversationListResponse getConversations(String userId) throws IOException, DifyApiException {
        // 获取会话列表
        return client.getConversations(userId, null, 10, "-updated_at");
    }

    public Conversation renameConversation(String conversationId,String newName,String userId) throws IOException, DifyApiException {
        // 重命名会话
        return client.renameConversation(conversationId, newName, false, userId);
    }

    public String deleteConversation(String conversationId,String userId) throws IOException, DifyApiException {
        // 删除会话
        SimpleResponse deleteResponse = client.deleteConversation(conversationId, userId);
        return deleteResponse == null ? "" : deleteResponse.getResult();
    }

    public String audioToText(File audioFile,String userId) throws IOException, DifyApiException {
        // 语音转文字
        AudioToTextResponse textResponse = client.audioToText(audioFile,userId);
        return textResponse.getText();
    }


}
