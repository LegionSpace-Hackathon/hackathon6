# Dify Proxy (Spring Boot)

本服务提供两个端点，按要求代理至 Dify：

- POST `/v1/files/upload`：multipart 表单，字段 `file`（文件）与固定 `user=shenyifei`；内部转发到 `http://dify-test.tongfudun.com/v1/files/upload`，并添加 `Authorization: Bearer app-q7ZrT6YE2sy5HhzbRmRyfaFt`。返回统一的JSON格式响应，包含文件详细信息。
- POST `/v1/chat-messages`：JSON 请求体，接受入参：
  ```json
  { "query": "...", "upload_file_id": "..." }
  ```
  服务拼装 Dify 所需负载并以 `text/event-stream` 转发到 `http://dify-test.tongfudun.com/v1/chat-messages`，并附带固定 Authorization。返回标准SSE流。

## 运行

- 要求：JDK 8、Maven 3.6+
- 启动：
  ```bash
  mvn spring-boot:run
  ```
- 端口：`http://localhost:8080`

## 特性

- 使用 Spring WebFlux + WebClient 代理上游 Dify 接口。
- 已配置连接池与超时：连接超时 10s、响应超时 30s、读/写超时 30s。
- 内置重试：对 5xx 响应与可恢复的网络异常（如 Connection refused/timeout/reset）进行指数退避重试（最多 3 次）。
- 统一返回格式：文件上传接口使用 `CommonResponse` 统一包装，包含 `code`、`message`、`data` 字段。
- 文件上传结果解析：自动解析 Dify 返回的 JSON 为结构化的 `UploadResult` 对象，包含文件ID、名称、大小、类型、预览URL等信息。
- 日志：
  - 上传接口成功时打印完整响应体；非 2xx 打印警告含状态码与响应体。
  - 聊天接口（SSE）按收到的每条数据片段逐条打印。
 - SSE 响应头：`Content-Type: text/event-stream`、`Cache-Control: no-cache, no-transform`、`Connection: keep-alive`、`X-Accel-Buffering: no`。
 - SSE 错误事件：异常将被转为一条 `event: error` 的 SSE 消息返回，便于前端统一处理。

## 示例

- 上传文件：
  ```bash
  curl -X POST http://localhost:8080/v1/files/upload \
    -F "file=@/path/to/your.pdf"
  ```
  
  返回格式：
  ```json
  {
    "code": 200,
    "message": "文件上传成功",
    "data": {
      "id": "8d251a6a-cedc-4326-9ad0-bb4e2b9903ca",
      "name": "data.xlsx",
      "size": 28948,
      "extension": "xlsx",
      "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "created_by": "5a9868aa-eb81-46e4-854d-b702bcbc876f",
      "created_at": 1757642912,
      "preview_url": null
    }
  }
  ```

- 开始聊天（SSE）：
  ```bash
  curl -N -X POST http://localhost:8080/v1/chat-messages \
    -H "Content-Type: application/json" \
    -H "Accept: text/event-stream" \
    -d '{"query":"请根据电商支付的明细数据，进行风险分析，制定风控特征和策略","upload_file_id":"65b917ab-3b5d-4d94-8867-37595d39e34c"}'
  ```

  - 返回为标准 SSE 流，服务端会持续推送 `data:` 行；
  - 发生异常时，服务端会推送一条错误事件：
    ```
    event: error
    data: {"error":"...错误信息..."}
    ```
  - 可在前端用 `fetch` 的 `ReadableStream` 逐块读取并按 `\n\n` 分帧解析。

## API 响应格式

### 文件上传接口响应格式

所有文件上传接口都使用统一的 `CommonResponse` 格式：

**成功响应**：
```json
{
  "code": 200,
  "message": "文件上传成功",
  "data": {
    "id": "文件ID",
    "name": "文件名",
    "size": 文件大小,
    "extension": "文件扩展名",
    "mime_type": "MIME类型",
    "created_by": "创建者ID",
    "created_at": 创建时间戳,
    "preview_url": "预览URL"
  }
}
```

**失败响应**：
```json
{
  "code": 500,
  "message": "错误信息",
  "data": null
}
```

### 聊天接口响应格式

聊天接口返回标准的 Server-Sent Events (SSE) 流，Content-Type 为 `text/event-stream`。

## 配置

参见 `src/main/resources/application.yml` 可定制：
- `app.dify.base-url`
- `app.dify.upload-path`
- `app.dify.chat-path`
- `app.dify.auth-token`
- `app.dify.fixed-user`

默认已设置为题述要求。

## 故障排查

- Connection refused：
  - 检查上游 Dify 服务是否可用/防火墙策略/是否需代理。
  - 视情况将 `app.dify.base-url` 切换为 `https://...`。
  - 观察应用日志中重试与失败原因，定位网络或服务端问题。

- JSON 解析失败：
  - 如果上传接口返回 "解析上传响应JSON失败" 错误，说明 Dify API 返回了未预期的字段。
  - 检查 `UploadResult` 类是否包含所有 Dify API 返回的字段。
  - 查看日志中的原始响应内容，确认字段名称和类型。

- Java 版本兼容性：
  - 确保使用 JDK 8 编译和运行。
  - 如果遇到 "class file version" 错误，检查编译和运行时的 Java 版本是否一致。
