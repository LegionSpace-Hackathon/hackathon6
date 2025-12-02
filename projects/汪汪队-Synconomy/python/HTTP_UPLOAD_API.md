# HTTP API 接口使用说明

## 功能概述

本服务提供多个 HTTP API 接口，包括：
- 文件上传到风险分析目录
- 文档下载（PDF/Word）
- 文档列表查询
- 健康检查

## 支持的文件格式

- `.xlsx` - Excel 2007+格式
- `.csv` - 逗号分隔值文件
- `.xls` - Excel 97-2003格式

## API接口

### 1. 文件上传接口

**端点**: `POST /upload/risk-analysis`

**请求格式**: `multipart/form-data`

**参数**:
- `file`: 要上传的文件（必需）
- `userId`: 用户ID（可选），用于文件名标识

**成功响应** (200):
```json
{
    "success": true,
    "message": "文件上传成功",
    "original_filename": "example.csv",
    "remote_path": "/usr/local/risk_analysis/data_user123.csv",
    "file_size": 1024
}
```

**说明**：
- 如果提供了 `userId` 参数，文件名会重命名为 `data_{userId}{扩展名}`
- 如果未提供 `userId` 参数，文件名会重命名为 `data{扩展名}`

**错误响应** (400/500):
```json
{
    "detail": "文件格式错误，只支持以下格式: .xlsx, .csv, .xls"
}
```

### 2. 文档下载接口

**端点**: `GET /download/document`

**功能**: 下载生成的文档文件（PDF/Word），文件必须位于 `DOCUMENT_OUTPUT_DIR` 目录下

**参数**:
- `file_path`: 本地文件路径（必需），必须位于 `DOCUMENT_OUTPUT_DIR` 目录下

**成功响应** (200): 返回文件流，Content-Type 根据文件类型自动设置

**错误响应**:
- **403 Forbidden**: 文件路径不在允许的目录下
- **404 Not Found**: 文件不存在
- **500 Internal Server Error**: 文件读取失败

### 3. 文档列表接口

**端点**: `GET /documents/list`

**功能**: 列出所有生成的文档文件（PDF/Word）

**成功响应** (200):
```json
{
    "success": true,
    "count": 2,
    "files": [
        {
            "filename": "document_1234567890.pdf",
            "path": "/usr/local/risk_analysis/docs/document_1234567890.pdf",
            "size": 102400,
            "modified_time": 1234567890,
            "format": "pdf",
            "download_url": "http://localhost:8002/download/document?file_path=/usr/local/risk_analysis/docs/document_1234567890.pdf"
        }
    ]
}
```

**说明**：
- 文件按修改时间倒序排列
- 只返回 PDF 和 Word 文档（.pdf, .docx, .doc）
- 每个文件包含下载 URL，可直接用于下载

### 4. 健康检查接口

**端点**: `GET /health`

**响应** (200):
```json
{
    "status": "healthy",
    "service": "Linux File Operations API",
    "version": "1.0.0"
}
```

## 使用示例

### 使用curl上传文件

```bash
# 上传CSV文件
curl -X POST "http://localhost:8002/upload/risk-analysis" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/file.csv" \
     -F "userId=user123"

# 上传Excel文件
curl -X POST "http://localhost:8002/upload/risk-analysis" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/file.xlsx" \
     -F "userId=user123"

# 下载文档文件
curl -O "http://localhost:8002/download/document?file_path=/usr/local/risk_analysis/docs/document_1234567890.pdf"

# 获取文档列表
curl "http://localhost:8002/documents/list"
```

### 使用Python requests

```python
import requests

# 上传文件
with open('data.csv', 'rb') as f:
    files = {'file': ('data.csv', f, 'text/csv')}
    data = {'userId': 'user123'}
    response = requests.post('http://localhost:8002/upload/risk-analysis', files=files, data=data)
    
if response.status_code == 200:
    result = response.json()
    print(f"上传成功: {result['remote_path']}")
else:
    print(f"上传失败: {response.text}")

# 下载文档文件
url = "http://localhost:8002/download/document"
params = {"file_path": "/usr/local/risk_analysis/docs/document_1234567890.pdf"}
response = requests.get(url, params=params)

if response.status_code == 200:
    with open("downloaded_document.pdf", "wb") as f:
        f.write(response.content)
    print("下载成功")

# 获取文档列表
response = requests.get("http://localhost:8002/documents/list")
if response.status_code == 200:
    result = response.json()
    print(f"共 {result['count']} 个文档")
    for file in result['files']:
        print(f"- {file['filename']}: {file['download_url']}")
```

### 使用JavaScript (fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8002/upload/risk-analysis', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log('上传成功:', data.remote_path);
    } else {
        console.error('上传失败:', data.detail);
    }
});
```

## 测试

运行测试脚本验证接口功能：

```bash
cd python
python test_http_upload.py
```

测试脚本会验证：
- 健康检查接口
- 有效格式文件上传
- 无效格式文件拒绝
- Excel文件上传

## 注意事项

### 文件上传接口
1. 服务器会自动创建`/usr/local/risk_analysis/`目录（如果不存在）
2. 上传的文件会被重命名为`data_{userId}`或`data`加上原始扩展名（取决于是否提供userId参数）
3. 文件权限设置为644（所有者可读写，其他用户只读）
4. 只支持表格格式文件（.xlsx, .csv, .xls），其他格式会被拒绝
5. 服务器需要能够SSH连接到目标Linux服务器

### 文档下载接口
1. 文件路径必须在 `DOCUMENT_OUTPUT_DIR` 配置的目录下（默认：`/usr/local/risk_analysis/docs/`）
2. 支持的文件格式：.pdf, .docx, .doc
3. 系统会进行路径安全检查，防止路径遍历攻击

### 文档列表接口
1. 只列出 PDF 和 Word 文档
2. 文件按修改时间倒序排列
3. 输出目录不存在时会返回空列表

## 错误处理

### 文件上传接口
- **400 Bad Request**: 文件格式不支持
- **500 Internal Server Error**: 服务器内部错误（如SSH连接失败、文件上传失败等）

### 文档下载接口
- **403 Forbidden**: 文件路径不在允许的目录下
- **404 Not Found**: 文件不存在
- **500 Internal Server Error**: 文件读取失败

### 文档列表接口
- **200 OK**: 即使目录不存在也返回成功（空列表）
- **500 Internal Server Error**: 服务器内部错误

所有错误都会返回详细的错误信息，便于调试和问题排查。
