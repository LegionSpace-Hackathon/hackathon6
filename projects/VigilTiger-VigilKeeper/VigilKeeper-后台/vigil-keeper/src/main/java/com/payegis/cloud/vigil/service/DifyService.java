package com.payegis.cloud.vigil.service;

import com.payegis.cloud.vigil.core.configure.DifyProperty;
import com.payegis.cloud.vigil.vo.FileVo;
import io.github.imfangs.dify.client.*;
import io.github.imfangs.dify.client.callback.ChatStreamCallback;
import io.github.imfangs.dify.client.callback.CompletionStreamCallback;
import io.github.imfangs.dify.client.callback.WorkflowStreamCallback;
import io.github.imfangs.dify.client.enums.FileTransferMethod;
import io.github.imfangs.dify.client.enums.FileType;
import io.github.imfangs.dify.client.enums.ResponseMode;
import io.github.imfangs.dify.client.event.*;
import io.github.imfangs.dify.client.exception.DifyApiException;
import io.github.imfangs.dify.client.model.DifyConfig;
import io.github.imfangs.dify.client.model.chat.*;
import io.github.imfangs.dify.client.model.common.SimpleResponse;
import io.github.imfangs.dify.client.model.completion.CompletionRequest;
import io.github.imfangs.dify.client.model.completion.CompletionResponse;
import io.github.imfangs.dify.client.model.datasets.*;
import io.github.imfangs.dify.client.model.file.FileInfo;
import io.github.imfangs.dify.client.model.file.FileUploadResponse;
import io.github.imfangs.dify.client.model.workflow.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

//@Service
@Slf4j
public class DifyService {
    //https://github.com/imfangs/dify-java-client?tab=readme-ov-file

    @Resource
    private DifyProperty difyProperty;
    private DifyChatClient chatClient;
    private DifyCompletionClient completionClient;
    private DifyWorkflowClient workflowClient;
    private DifyClient client;
    @PostConstruct
    void init() {
        // 创建完整的 Dify 客户端
        client = DifyClientFactory.createClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());
        // 创建聊天客户端
        chatClient = DifyClientFactory.createChatClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());
        // 创建文本生成客户端
        completionClient = DifyClientFactory.createCompletionClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());
        // 创建工作流客户端
        workflowClient = DifyClientFactory.createWorkflowClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());

        // 使用自定义配置创建客户端
        DifyConfig config = DifyConfig.builder()
                .baseUrl(difyProperty.getDifyUrl())
                .apiKey(difyProperty.getDifyKey())
                .connectTimeout(5000)
                .readTimeout(60000)
                .writeTimeout(30000)
                .build();

        DifyClient clientWithConfig = DifyClientFactory.createClient(config);
    }

    public void sendMessage(String msg,String userId) throws IOException, DifyApiException {
        // 创建聊天消息
        ChatMessage message = ChatMessage.builder()
                .query(msg)
                .user(getUser(userId))
                .responseMode(ResponseMode.BLOCKING)
                .build();

        // 发送消息并获取响应
        ChatMessageResponse response = chatClient.sendChatMessage(message);
        System.out.println("回复: " + response.getAnswer());
        System.out.println("会话ID: " + response.getConversationId());
        System.out.println("消息ID: " + response.getMessageId());
    }

    public void sendMessageStream(String msg,String userId) throws IOException, DifyApiException {
        // 创建聊天消息
        ChatMessage message = ChatMessage.builder()
                .query(msg)
                .user(getUser(userId))
                .responseMode(ResponseMode.STREAMING)
                .build();

        // 发送流式消息
        chatClient.sendChatMessageStream(message, new ChatStreamCallback() {
            @Override
            public void onMessage(MessageEvent event) {
                System.out.println("收到消息片段: " + event.getAnswer());
            }

            @Override
            public void onMessageEnd(MessageEndEvent event) {
                System.out.println("消息结束，完整消息ID: " + event.getMessageId());
            }

            @Override
            public void onError(ErrorEvent event) {
                System.err.println("错误: " + event.getMessage());
            }

            @Override
            public void onException(Throwable throwable) {
                System.err.println("异常: " + throwable.getMessage());
            }
        });
    }

    public void sendMessageStream(String msg,String userId,String fileId) throws IOException, DifyApiException {
        List<FileInfo> files = new ArrayList<>();
        FileInfo fileInfo = new FileInfo();
        fileInfo.setType(FileType.DOCUMENT);
        fileInfo.setTransferMethod(FileTransferMethod.LOCAL_FILE);
        fileInfo.setUploadFileId(fileId);
        // 创建聊天消息
        ChatMessage message = ChatMessage.builder()
                .query(msg)
                .user(getUser(userId))
                .files(files)
                .responseMode(ResponseMode.STREAMING)
                .build();

        // 发送流式消息
        chatClient.sendChatMessageStream(message, new ChatStreamCallback() {
            @Override
            public void onMessage(MessageEvent event) {
                System.out.println("收到消息片段: " + event.getAnswer());
            }

            @Override
            public void onMessageEnd(MessageEndEvent event) {
                System.out.println("消息结束，完整消息ID: " + event.getMessageId());
            }

            @Override
            public void onError(ErrorEvent event) {
                System.err.println("错误: " + event.getMessage());
            }

            @Override
            public void onException(Throwable throwable) {
                System.err.println("异常: " + throwable.getMessage());
            }
        });
    }

    public FileVo uploadFile(File file,String userId) throws IOException, DifyApiException {
        FileUploadResponse response = client.uploadFile(file,getUser(userId));
        FileVo vo = new FileVo();
        vo.setId(response.getId());
        vo.setName(response.getName());
        vo.setSize(response.getSize());
        vo.setExtension(response.getExtension());
        vo.setMimeType(response.getMimeType());
        vo.setCreatedBy(response.getCreatedBy());
        vo.setCreatedAt(response.getCreatedAt());

        return vo;
    }

    public void getMessage(String conversationId,String userId) throws IOException, DifyApiException {
        // 获取会话历史消息
        MessageListResponse messages = chatClient.getMessages(conversationId, getUser(userId), null, 10);
    }

    public void getConversations(String userId) throws IOException, DifyApiException {
        // 获取会话列表
        ConversationListResponse conversations = chatClient.getConversations(getUser(userId), null, 10, "-updated_at");
    }

    public void renameConversation(String conversationId,String newName,String userId) throws IOException, DifyApiException {
        // 重命名会话
        Conversation renamedConversation = chatClient.renameConversation(conversationId, newName, false, getUser(userId));
    }

    public void deleteConversation(String conversationId,String userId) throws IOException, DifyApiException {
        // 删除会话
        SimpleResponse deleteResponse = chatClient.deleteConversation(conversationId, getUser(userId));
    }

    public void feedbackMessage(String messageId,String feedbackMessage,String userId) throws IOException, DifyApiException {
        // 发送消息反馈（点赞）
        SimpleResponse feedbackResponse = chatClient.feedbackMessage(messageId, "like", getUser(userId), feedbackMessage);
    }

    public void getSuggestedQuestions(String messageId,String feedbackMessage,String userId) throws IOException, DifyApiException {
        // 获取建议问题
        SuggestedQuestionsResponse suggestedQuestions = chatClient.getSuggestedQuestions(messageId, getUser(userId));
    }

    public void audioToText(File audioFile,String userId) throws IOException, DifyApiException {
        // 语音转文字
        AudioToTextResponse textResponse = chatClient.audioToText(audioFile, getUser(userId));
        System.out.println("转换后的文本: " + textResponse.getText());
    }

    public void textToAudio(String text,String userId) throws IOException, DifyApiException {
        // 文字转语音
        byte[] audioData = chatClient.textToAudio(null, text, getUser(userId));
    }

    public void sendCompletionMessage(String content,String userId) throws IOException, DifyApiException {
        // 创建请求
        Map<String, Object> inputs = new HashMap<>();
        inputs.put("content", content);

        CompletionRequest request = CompletionRequest.builder()
                .inputs(inputs)
                .responseMode(ResponseMode.BLOCKING)
                .user(getUser(userId))
                .build();

        // 发送请求并获取响应
        CompletionResponse response = completionClient.sendCompletionMessage(request);
        System.out.println("生成的文本: " + response.getAnswer());
    }

    public void sendCompletionMessageStream(String content,String userId) throws IOException, DifyApiException {
        // 创建请求
        Map<String, Object> inputs = new HashMap<>();
        inputs.put("content", content);

        CompletionRequest request = CompletionRequest.builder()
                .inputs(inputs)
                .responseMode(ResponseMode.STREAMING)
                .user(getUser(userId))
                .build();

        // 发送流式请求
        completionClient.sendCompletionMessageStream(request, new CompletionStreamCallback() {
            @Override
            public void onMessage(MessageEvent event) {
                System.out.println("收到消息片段: " + event.getAnswer());
            }

            @Override
            public void onMessageEnd(MessageEndEvent event) {
                System.out.println("消息结束，完整消息ID: " + event.getMessageId());
            }

            @Override
            public void onError(ErrorEvent event) {
                System.err.println("错误: " + event.getMessage());
            }

            @Override
            public void onException(Throwable throwable) {
                System.err.println("异常: " + throwable.getMessage());
            }
        });
    }

    public void stopCompletion(String taskId,String userId) throws IOException, DifyApiException {
        // 停止文本生成
        SimpleResponse stopResponse = completionClient.stopCompletion(taskId, getUser(userId));
    }

    public void runWorkflow(String content,String userId) throws IOException, DifyApiException {
        // 创建工作流请求
        Map<String, Object> inputs = new HashMap<>();
        inputs.put("content", content);

        WorkflowRunRequest request = WorkflowRunRequest.builder()
                .inputs(inputs)
                .responseMode(ResponseMode.BLOCKING)
                .user(getUser(userId))
                .build();

        // 执行工作流并获取响应
        WorkflowRunResponse response = workflowClient.runWorkflow(request);
        System.out.println("工作流执行ID: " + response.getTaskId());

        // 输出结果
        if (response.getData() != null) {
            for (Map.Entry<String, Object> entry : response.getData().getOutputs().entrySet()) {
                System.out.println(entry.getKey() + ": " + entry.getValue());
            }
        }
    }

    public void runWorkflowStream(String content,String userId) throws IOException, DifyApiException {
        // 创建工作流请求
        Map<String, Object> inputs = new HashMap<>();
        inputs.put("content", content);

        WorkflowRunRequest request = WorkflowRunRequest.builder()
                .inputs(inputs)
                .responseMode(ResponseMode.STREAMING)
                .user(getUser(userId))
                .build();

        // 执行工作流流式请求
        workflowClient.runWorkflowStream(request, new WorkflowStreamCallback() {
            @Override
            public void onWorkflowStarted(WorkflowStartedEvent event) {
                System.out.println("工作流开始: " + event);
            }

            @Override
            public void onNodeStarted(NodeStartedEvent event) {
                System.out.println("节点开始: " + event);
            }

            @Override
            public void onNodeFinished(NodeFinishedEvent event) {
                System.out.println("节点完成: " + event);
            }

            @Override
            public void onWorkflowFinished(WorkflowFinishedEvent event) {
                System.out.println("工作流完成: " + event);
            }

            @Override
            public void onError(ErrorEvent event) {
                System.err.println("错误: " + event.getMessage());
            }

            @Override
            public void onException(Throwable throwable) {
                System.err.println("异常: " + throwable.getMessage());
            }
        });
    }

    public void stopWorkflow(String taskId,String userId) throws IOException, DifyApiException {
        // 停止工作流
        WorkflowStopResponse stopResponse = workflowClient.stopWorkflow(taskId, getUser(userId));
    }

    public void getWorkflowRun(String workflowRunId) throws IOException, DifyApiException {
        // 获取工作流执行情况
        WorkflowRunStatusResponse statusResponse = workflowClient.getWorkflowRun(workflowRunId);
    }

    public void getWorkflowLogs(String workflowRunId) throws IOException, DifyApiException {
        // 获取工作流日志
        WorkflowLogsResponse logsResponse = workflowClient.getWorkflowLogs(null, null, 1, 10);
    }

    public void createDataset(String workflowRunId) throws IOException, DifyApiException {
        // 创建知识库客户端
        DifyDatasetsClient datasetsClient = DifyClientFactory.createDatasetsClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());

        // 创建知识库
        CreateDatasetRequest createRequest = CreateDatasetRequest.builder()
                .name("测试知识库-" + System.currentTimeMillis())
                .description("这是一个测试知识库")
                .indexingTechnique("high_quality")
                .permission("only_me")
                .provider("vendor")
                .build();

        DatasetResponse dataset = datasetsClient.createDataset(createRequest);
        System.out.println("创建的知识库ID: " + dataset.getId());

        // 获取知识库列表
        DatasetListResponse datasetList = datasetsClient.getDatasets(1, 10);
        System.out.println("知识库总数: " + datasetList.getTotal());
    }

    public void createDocumentByText(String datasetId,String documentId) throws IOException, DifyApiException {
        // 创建知识库客户端
        DifyDatasetsClient datasetsClient = DifyClientFactory.createDatasetsClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());

        // 通过文本创建文档
        CreateDocumentByTextRequest docRequest = CreateDocumentByTextRequest.builder()
                .name("测试文档-" + System.currentTimeMillis())
                .text("这是一个测试文档的内容。\n这是第二行内容。\n这是第三行内容。")
                .indexingTechnique("high_quality")
                .build();

        DocumentResponse docResponse = datasetsClient.createDocumentByText(datasetId, docRequest);
        System.out.println("创建的文档ID: " + docResponse.getDocument().getId());

    }

    public void getDocuments(String datasetId) throws IOException, DifyApiException {
        // 创建知识库客户端
        DifyDatasetsClient datasetsClient = DifyClientFactory.createDatasetsClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());

        // 获取文档列表
        DocumentListResponse docList = datasetsClient.getDocuments(datasetId, null, 1, 10);
        System.out.println("文档总数: " + docList.getTotal());

    }

    public void deleteDocument(String datasetId,String documentId) throws IOException, DifyApiException {
        // 创建知识库客户端
        DifyDatasetsClient datasetsClient = DifyClientFactory.createDatasetsClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());

        // 删除文档
        datasetsClient.deleteDocument(datasetId, documentId);

    }

    public void retrieveDataset(String datasetId) throws IOException, DifyApiException {
        // 创建知识库客户端
        DifyDatasetsClient datasetsClient = DifyClientFactory.createDatasetsClient(difyProperty.getDifyUrl(), difyProperty.getDifyKey());
        // 创建检索请求
        RetrievalModel retrievalModel = new RetrievalModel();
        retrievalModel.setTopK(3);
        retrievalModel.setScoreThreshold(0.5f);

        RetrieveRequest retrieveRequest = RetrieveRequest.builder()
                .query("什么是人工智能")
                .retrievalModel(retrievalModel)
                .build();

        // 发送检索请求
        RetrieveResponse retrieveResponse = datasetsClient.retrieveDataset(datasetId, retrieveRequest);

        // 处理检索结果
        System.out.println("检索查询: " + retrieveResponse.getQuery().getContent());
        System.out.println("检索结果数量: " + retrieveResponse.getRecords().size());
        retrieveResponse.getRecords().forEach(record -> {
            System.out.println("分数: " + record.getScore());
            System.out.println("内容: " + record.getSegment().getContent());
        });

    }

    private String getUser(String userId) {
        return "user-"+userId;
    }


}
