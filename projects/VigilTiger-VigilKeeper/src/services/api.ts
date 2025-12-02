import { fetchEventSource } from '@microsoft/fetch-event-source';

export const BASE_URL = 'http://192.168.208.86:8890/api/vigil-keeper';

// 获取token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// 设置token
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// 移除token
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 如果有token，添加到header
  if (token) {
    headers['token'] = token;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.code !== 200) {
    throw new Error(data.msg || '请求失败');
  }

  return data.data as T;
}

// 登录接口响应类型
export interface LoginResponse {
  token?: string;
  [key: string]: unknown;
}

// 登录接口
export const login = async (mobile: string): Promise<LoginResponse> => {
  const response = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
  });

  // 如果返回了token，保存到localStorage
  if (response.token) {
    setToken(response.token);
  }

  return response;
};

// 文件上传响应类型
export interface FileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  createdBy: string;
  createdAt: number;
}

// 文件上传接口
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['token'] = token;
  }

  const response = await fetch(`${BASE_URL}/ai/files/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.code !== 200) {
    throw new Error(data.msg || '文件上传失败');
  }

  return data.data as FileUploadResponse;
};

// 确认合同请求类型
export interface ConfirmContractRequest {
  id: string;
}

// 确认合同响应类型
export interface ConfirmContractResponse {
  success?: boolean;
  [key: string]: unknown;
}

// 确认合同接口
export const confirmContract = async (id: string): Promise<ConfirmContractResponse> => {
  const response = await request<ConfirmContractResponse>('/ai/confirmContract', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  return response;
};

// 获取确认状态请求类型
export interface GetConfirmStatusRequest {
  id: string;
}

// 获取确认状态响应类型（data 字段为数字，1 表示已完成）
export type GetConfirmStatusResponse = number;

// 获取确认状态接口
export const getConfirmStatus = async (id: string): Promise<GetConfirmStatusResponse> => {
  const response = await request<GetConfirmStatusResponse>('/ai/getConfirmStatus', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  return response;
};

// 聊天消息请求类型
export interface ChatMessageRequest {
  fileId?: string;
  msg: string;
  extension?: string;
}

// SSE事件类型
export type SSEEventType = 
  | 'workflow_started'
  | 'node_started'
  | 'node_finished'
  | 'workflow_finished'
  | 'message'
  | 'error';

// SSE事件数据基础结构
export interface SSEEventData {
  event: SSEEventType;
  conversation_id?: string;
  message_id?: string;
  created_at?: number;
  task_id?: string;
  workflow_run_id?: string;
  data?: unknown;
  [key: string]: unknown;
}

// SSE事件回调函数类型
export type SSEEventCallback = (event: SSEEventData) => void;
export type SSEErrorCallback = (error: Error) => void;
export type SSECompleteCallback = () => void;

// 使用EventSource发送聊天消息（SSE流式响应）
export const sendChatMessageStream = (
  params: ChatMessageRequest,
  onEvent: SSEEventCallback,
  onError?: SSEErrorCallback,
  onComplete?: SSECompleteCallback
): EventSource => {
  const token = getToken();
  
  // 构建查询参数
  const queryParams = new URLSearchParams({
    msg: params.msg,
  });
  
  if (params.fileId) {
    queryParams.append('fileId', params.fileId);
  }
  
  if (params.extension) {
    queryParams.append('extension', params.extension);
  }

  // 构建URL（注意：EventSource只支持GET请求，但我们可以通过查询参数传递数据）
  // 如果接口必须使用POST，需要先发送POST请求获取SSE URL，或者使用fetch + ReadableStream
  // 这里假设接口支持GET方式，如果必须POST，需要修改实现
  const url = `${BASE_URL}/ai/chat-messages?${queryParams.toString()}`;

  // 创建EventSource实例
  const eventSource = new EventSource(url);

  // 监听消息事件
  eventSource.onmessage = (event) => {
    try {
      const data: SSEEventData = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('解析SSE数据失败:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('解析数据失败'));
      }
    }
  };

  // 监听错误事件
  eventSource.onerror = (error) => {
    console.error('SSE连接错误:', error);
    if (onError) {
      onError(new Error('SSE连接错误'));
    }
    eventSource.close();
    if (onComplete) {
      onComplete();
    }
  };

  // 监听自定义事件类型
  eventSource.addEventListener('workflow_started', (event: MessageEvent) => {
    try {
      const data: SSEEventData = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('解析workflow_started事件失败:', error);
    }
  });

  eventSource.addEventListener('node_started', (event: MessageEvent) => {
    try {
      const data: SSEEventData = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('解析node_started事件失败:', error);
    }
  });

  eventSource.addEventListener('node_finished', (event: MessageEvent) => {
    try {
      const data: SSEEventData = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('解析node_finished事件失败:', error);
    }
  });

  eventSource.addEventListener('workflow_finished', (event: MessageEvent) => {
    try {
      const data: SSEEventData = JSON.parse(event.data);
      onEvent(data);
      eventSource.close();
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('解析workflow_finished事件失败:', error);
    }
  });

  return eventSource;
};

// 使用 fetch-event-source 处理 POST 请求的 SSE 流式响应
export const sendChatMessageStreamPost = (
  params: ChatMessageRequest,
  onEvent: SSEEventCallback,
  onError?: SSEErrorCallback,
  onComplete?: SSECompleteCallback
): AbortController => {
  const token = getToken();
  const abortController = new AbortController();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['token'] = token;
  }

  fetchEventSource(`${BASE_URL}/ai/chat-messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
    signal: abortController.signal,
    onmessage(event) {
      try {
        // fetch-event-source 会自动解析 data: 前缀
        const dataStr = event.data;
        if (dataStr && dataStr.trim()) {
          const parsedData = JSON.parse(dataStr);
          
          // 构建事件数据对象
          const data: SSEEventData = {
            ...parsedData,
            // 如果解析的数据中有 event 字段，使用它；否则使用 event.event
            event: (parsedData.event || event.event || 'message') as SSEEventType,
          };
          
          onEvent(data);

          // 如果是 workflow_finished 事件，完成流
          if (data.event === 'workflow_finished') {
            abortController.abort();
            if (onComplete) {
              onComplete();
            }
          }
        }
      } catch (error) {
        console.error('解析SSE数据失败:', error, '数据:', event.data);
        // 不抛出错误，继续处理后续事件
      }
    },
    onerror(error) {
      console.error('SSE连接错误:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('SSE连接错误'));
      }
      abortController.abort();
      if (onComplete) {
        onComplete();
      }
      // 抛出错误以停止重试
      throw error;
    },
    onclose() {
      // 连接关闭时调用完成回调
      if (onComplete) {
        onComplete();
      }
    },
    // 配置选项
    openWhenHidden: true, // 即使页面隐藏也保持连接
  }).catch((error) => {
    if (error.name !== 'AbortError' && !abortController.signal.aborted) {
      console.error('SSE请求失败:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('请求失败'));
      }
    }
  });

  return abortController;
};

