/**
 * Dify 流式API客户端
 *
 * 优化功能：
 * - 支持不同事件类型的精确处理
 * - node_started: 显示"正在思考中..."状态
 * - message: 开始输出消息内容，移除思考状态
 * - error: 显示错误信息并结束对话
 * - 完整的事件生命周期管理
 * - 类型安全的事件处理
 *
 * @author Space Front Team
 * @version 2.0.0
 */

import {
  EventSourceMessage,
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source';
import apiClient from '../../../lib/apiClient';
import { FileInfo } from '../components/Chat/FileAttachment';
import i18n from '@/i18n';

// Dify API 配置
const DIFY_API_BASE_URL = '/dify'; // 通过代理转发到Dify API，apiClient会自动添加/api前缀
const token = localStorage.getItem('token');

// Dify 事件类型常量
export const DIFY_EVENT_TYPES = {
  NODE_STARTED: 'node_started',
  MESSAGE: 'message',
  MESSAGE_END: 'message_end',
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_FINISHED: 'workflow_finished',
  ERROR: 'error',
  PING: 'ping',
} as const;

// 事件类型
export type DifyEventType = (typeof DIFY_EVENT_TYPES)[keyof typeof DIFY_EVENT_TYPES];

/**
 * 提取错误消息的辅助函数
 * @param parsedData 解析后的数据
 * @returns 错误消息字符串
 */
const extractErrorMessage = (parsedData: any): string => {
  // 尝试从不同字段提取错误信息
  if (parsedData.message) return parsedData.message;
  if (parsedData.error) return parsedData.error;
  if (parsedData.details) return parsedData.details;
  if (parsedData.description) return parsedData.description;

  // 默认错误消息
  return '输出失败，请联系技术人员';
};

// 全局任务管理
let currentTaskId: string | null = null;
let currentAbortController: AbortController | null = null;

/**
 * 获取当前正在执行的任务ID
 */
export const getCurrentTaskId = (): string | null => {
  return currentTaskId;
};

/**
 * 设置当前任务ID
 */
export const setCurrentTaskId = (taskId: string | null): void => {
  currentTaskId = taskId;
};

/**
 * 获取当前的AbortController
 */
export const getCurrentAbortController = (): AbortController | null => {
  return currentAbortController;
};

/**
 * 设置当前的AbortController
 */
export const setCurrentAbortController = (controller: AbortController | null): void => {
  currentAbortController = controller;
};

/**
 * 清理所有流式请求状态
 * 用于组件卸载或页面离开时的清理
 */
export const cleanupStreamingState = (): void => {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  setCurrentTaskId(null);
  setCurrentAbortController(null);
};

/**
 * 智能导航函数 - 根据路径类型决定导航方式
 * @param navigate React Router的navigate函数
 * @param options 导航选项
 */
export const smartNavigate = (
  navigate: (path: string) => void,
  options: {
    conversationId?: string;
    agentId?: string;
    keepParams?: boolean;
    clearConversation?: boolean;
  } = {}
) => {
  const { conversationId, agentId, keepParams = true, clearConversation = false } = options;

  // 原路径：使用原有的URL结构
  const currentParams = new URLSearchParams(window.location.search);
  const newParams = new URLSearchParams();

  if (keepParams) {
    // 保持现有参数
    currentParams.forEach((value, key) => {
      newParams.set(key, value);
    });
  }

  // 设置必要的参数
  if (agentId) {
    newParams.set('id', agentId);
  }

  if (conversationId) {
    newParams.set('conversation', conversationId);
    newParams.set('hasHistory', 'true');
  } else if (clearConversation) {
    // 清除会话参数
    newParams.delete('conversation');
    newParams.delete('hasHistory');
  }

  navigate(`/agent?${newParams.toString()}`);
};


/**
 * 获取当前应该使用的API基础路径（用于apiClient调用）
 * @returns API基础路径字符串
 */
export const getCurrentApiBaseUrl = (): string => {
  return DIFY_API_BASE_URL;
};

/**
 * 获取当前应该使用的完整API基础路径（用于fetchEventSource调用）
 * @returns 完整的API基础路径字符串
 */
export const getCurrentFullApiBaseUrl = (): string => {
  return `/api${DIFY_API_BASE_URL}`;
};

/**
 * 获取当前应该使用的请求头配置
 * @param agentId 智能体ID
 * @returns 请求头配置对象
 */
export const getCurrentRequestHeaders = (
  agentId?: string,
  flag: boolean = false
): Record<string, string> => {
  let baseHeaders = {};
  if (flag) {
    baseHeaders = {
      Authorization: `Bearer ${token}`,
      language: i18n.language === 'en' ? 'en' : 'zh',
    };
  } else {
    baseHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      language: i18n.language === 'en' ? 'en' : 'zh',
    };
  }

  // 原路径：使用agentType
  return {
    ...baseHeaders,
    agentType: mapAgentIdToType(agentId),
  };
};

/**
 * 获取用户标识
 * 优先使用mobile，其次使用email，如果都没有则返回"-1"表示访客
 * @returns 用户标识字符串
 */
export const getUserIdentifier = (): string => {
  try {
    // 尝试从localStorage获取用户信息
    const userInfoStr = localStorage.getItem('user');
    let baseUserId = '-1'; // 默认访客标识

    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      // 优先使用mobile，其次使用email
      if (userInfo.mobileOld) {
        baseUserId = userInfo.mobileOld;
      } else if (userInfo.email) {
        baseUserId = userInfo.email;
      }
    }

    // 返回基础用户标识
    return baseUserId;
  } catch (error) {
    console.error('获取用户标识失败:', error);
    return '-1'; // 出错时返回访客标识
  }
};
export const getCurrentConversation = (): any => {
  const currentAgentId = getCurrentAgentId();
  const storageKey = `agentConversation_${currentAgentId}`;
  const agentConversation = localStorage.getItem(storageKey);
  if (!agentConversation) return false;
  const agentConversationObj = JSON.parse(agentConversation || '{}');
  if (
    getUserIdentifier() === agentConversationObj.userId &&
    currentAgentId === agentConversationObj.agentId
  ) {
    return agentConversationObj.conversationId;
  }
  return false;
};

export const setCurrentConversation = (conversationId: any) => {
  const currentAgentId = getCurrentAgentId();
  const storageKey = `agentConversation_${currentAgentId}`;
  const agentConversation = {
    conversationId: conversationId,
    agentId: currentAgentId,
    userId: getUserIdentifier(),
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(storageKey, JSON.stringify(agentConversation));
};

/**
 * 清除指定智能体的会话记录
 * @param agentId 智能体ID，如果不提供则清除当前智能体的记录
 */
export const clearCurrentConversation = (agentId?: string) => {
  const targetAgentId = agentId || getCurrentAgentId();
  const storageKey = `agentConversation_${targetAgentId}`;
  localStorage.removeItem(storageKey);
  localStorage.removeItem('agent_messages');
};

/**
 * 从URL路径中获取当前agentId
 * @returns 当前路径中的agentId
 */
export const getCurrentAgentId = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = urlParams.get('id');
  return agentId || 'customer-service'; // 默认返回客服智能体ID
};

// 智能体ID到请求头类型的映射
export const mapAgentIdToType = (agentId?: string): string => {
  // 如果没有提供agentId，则从URL路径中获取
  const effectiveAgentId = getCurrentAgentId();
  return "daily";
};

// Plugin信息接口
export interface PluginInfo {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  avatar: string;
  logo: string;
  // 其他可能的字段
  [key: string]: any;
}

// Dify 消息请求接口
export interface DifyMessageRequest {
  query: string;
  user: string; // Changed from optional to required
  conversation_id?: string;
  response_mode: 'streaming' | 'blocking';
  inputs?: Record<string, any>;
}

// Dify 消息响应接口
export interface DifyMessageResponse {
  id: string;
  answer: string;
  conversation_id: string;
  created_at: number;
  metadata?: {
    usage?: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
    references?: Array<{
      content: string;
      url?: string;
    }>;
  };
}

/**
 * Dify 流式消息解析器接口
 *
 * 使用示例：
 * ```typescript
 * const parser: DifyStreamParser = {
 *   onThinking: () => setThinkingStatus(true),
 *   onMessageStart: () => setThinkingStatus(false),
 *   onMessage: (content) => appendMessage(content),
 *   onStreamError: (error) => showError(error),
 *   onDone: () => markMessageComplete()
 * };
 * ```
 */
export interface DifyStreamParser {
  onMessage: (message: string) => void;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
  onThinking?: () => void; // 新增：节点开始执行，显示"正在思考中..."
  onMessageStart?: () => void; // 新增：开始输出消息内容，移除思考状态
  onStreamError?: (errorMessage: string) => void; // 新增：流式输出错误
}

/**
 * 获取智能体信息
 * @param agentId 智能体ID
 * @returns 智能体信息
 */
export const getDifyAgentInfo = async (agentId?: string): Promise<PluginInfo | any> => {
  try {
    // 使用原有的dify/info接口
    const apiBaseUrl = getCurrentApiBaseUrl();
    const headers = getCurrentRequestHeaders(agentId);

    const response = await apiClient.get(`${apiBaseUrl}/info`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('获取智能体信息失败', error);
    throw new Error('获取智能体信息失败');
  }
};

/**
 * 停止当前的流式响应
 * @param taskId 任务ID
 * @param agentId 智能体ID
 * @returns 停止结果
 */
export const stopStreamingResponse = async (
  taskId: string,
  agentId?: string
): Promise<{ result: string }> => {
  try {
    const userIdentifier = getUserIdentifier();
    const apiBaseUrl = getCurrentApiBaseUrl();
    const headers = getCurrentRequestHeaders(agentId);

    const response = await apiClient.post(
      `${apiBaseUrl}/chat-messages/${taskId}/stop`,
      {
        user: userIdentifier,
      },
      {
        headers,
      }
    );

    // 停止成功后清理当前任务状态
    if (currentTaskId === taskId) {
      setCurrentTaskId(null);
      if (currentAbortController) {
        currentAbortController.abort();
        setCurrentAbortController(null);
      }
    }

    return response.data;
  } catch (error) {
    console.error('停止流式响应失败', error);
    throw new Error('停止流式响应失败');
  }
};

/**
 * 发送流式聊天消息
 * @param agentId 智能体ID
 * @param message 消息内容
 * @param parser 流式解析器，支持以下回调：
 *   - onThinking: 节点开始执行时触发，用于显示"正在思考中..."
 *   - onMessageStart: 开始输出消息内容时触发，用于移除思考状态
 *   - onMessage: 接收到消息内容时触发
 *   - onStreamError: 流式输出错误时触发，显示错误信息并结束对话
 *   - onError: 一般错误处理
 *   - onData: 原始数据处理
 *   - onDone: 流式输出完成时触发
 * @param conversationId 会话ID
 * @param files 文件列表，符合Dify API格式
 */
export const sendStreamingChatMessage = async (
  agentId: string,
  message: string,
  parser: DifyStreamParser,
  conversationId?: string,
  files?: any[],
  pluginAddInfo?: any
): Promise<void> => {
  // 验证必要参数
  if (!message || message.trim() === '') {
    throw new Error('消息内容不能为空');
  }

  const headers = getCurrentRequestHeaders(agentId);

  try {
    // 创建新的AbortController用于控制请求
    const abortController = new AbortController();
    setCurrentAbortController(abortController);

    // 获取用户标识
    const userIdentifier = getUserIdentifier();

    // 准备请求体
    const requestBody: any = {
      inputs: { timestamp: new Date().getTime() },
      query: message.trim(), // 确保query参数有值且去除前后空格
      response_mode: 'streaming',
      user: userIdentifier, // 使用真实用户标识
    };

    // 如果有pluginAddInfo，添加提示词和知识库ID到inputs
    if (pluginAddInfo) {
      // 根据语言选择提示词
      const tipWord =
        i18n.language === 'en' && pluginAddInfo.tipWordEn
          ? pluginAddInfo.tipWordEn
          : pluginAddInfo.tipWord;

      const mcpconfig = {};
      if (pluginAddInfo.agentTools && pluginAddInfo.agentTools.length > 0) {
        pluginAddInfo.agentTools.forEach(tool => {
          if (tool.status) { // 只添加启用的工具
            // 如果 transferMode 是 'streamable'，则添加 '_http' 后缀
            const transport = tool.transferMode === 'streamable' 
              ? 'streamable_http' 
              : tool.transferMode;
              mcpconfig[tool.mcpName] = {
              transport,
              url: tool.url,
              headers : {
                Authorization: tool.authKey || ''
              }
            };
          }
        });
      }
      if (mcpconfig) {
        requestBody.inputs.mcpconfig = JSON.stringify(mcpconfig);
      }

      // 构建增强的inputs对象
      requestBody.inputs = {
        ...requestBody.inputs,
        prompt: tipWord || '', // 提示词
        databaseId: pluginAddInfo.difyDatasetId || '', // 知识库ID
      };
    }

    // 只有当conversationId有值时才添加到请求中
    requestBody.conversation_id = conversationId || '';

    // 如果有文件，添加到请求中
    if (files && files.length > 0) {
      requestBody.files = files;
    }
    const apiBaseUrl = getCurrentFullApiBaseUrl();
    await fetchEventSource(`${apiBaseUrl}/chat-messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      openWhenHidden: true,
      signal: abortController.signal, // 添加abort信号
      async onopen(response) {
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          return; // everything's good
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          if (parser.onError) {
            parser.onError(new Error('Client-side error'));
          }
        } else {
          if (parser.onError) {
            parser.onError(new Error('Retriable error'));
          }
        }
      },
      onmessage: (event: EventSourceMessage) => {
        try {
          if (event.data) {
            if (event.data === '[DONE]') {
              if (parser.onDone) {
                parser.onDone();
              }
              return;
            }

            const parsedData = JSON.parse(event.data);

            // 提取并保存task_id
            if (parsedData.task_id && !currentTaskId) {
              setCurrentTaskId(parsedData.task_id);
            }

            // 处理不同类型的事件
            switch (parsedData.event) {
              case DIFY_EVENT_TYPES.WORKFLOW_STARTED:
                // 节点开始执行，显示"正在思考中..."
                console.log('节点开始执行:', parsedData);
                if (parser.onThinking) {
                  parser.onThinking();
                }
                break;

              case DIFY_EVENT_TYPES.MESSAGE:
                // 开始输出消息内容，移除思考状态
                if (parser.onMessageStart) {
                  parser.onMessageStart();
                }

                // 处理消息内容
                if (parsedData.answer && typeof parsedData.answer === 'string') {
                  parser.onMessage(parsedData.answer);
                }
                break;

              case DIFY_EVENT_TYPES.ERROR:
                // 流式输出错误，显示错误信息并结束对话
                console.error('流式输出错误:', parsedData);
                const errorMessage = extractErrorMessage(parsedData);
                if (parser.onStreamError) {
                  parser.onStreamError(errorMessage);
                } else if (parser.onError) {
                  parser.onError(new Error(errorMessage));
                }
                return; // 结束此条对话

              case DIFY_EVENT_TYPES.MESSAGE_END:
              case DIFY_EVENT_TYPES.WORKFLOW_FINISHED:
                // 工作流程结束
                console.log('工作流程结束:', parsedData);
                break;

              // case DIFY_EVENT_TYPES.WORKFLOW_STARTED:
              //   // 工作流开始
              //   console.log('工作流开始:', parsedData);
              //   break;

              case DIFY_EVENT_TYPES.PING:
                // 心跳检测，保持连接
                console.log('心跳检测:', parsedData);
                break;

              default:
                // 兼容处理其他情况和直接返回内容的情况
                if (parsedData.answer && typeof parsedData.answer === 'string') {
                  // 兼容直接返回answer的情况
                  parser.onMessage(parsedData.answer);
                } else if (parsedData.text && typeof parsedData.text === 'string') {
                  // 有些API返回text字段而不是answer
                  parser.onMessage(parsedData.text);
                } else if (parsedData.content && typeof parsedData.content === 'string') {
                  // 有些API返回content字段
                  parser.onMessage(parsedData.content);
                }
                break;
            }

            // 调用数据处理回调
            if (parser.onData) {
              parser.onData(parsedData);
            }
          }
        } catch (error) {
          console.error('解析流式数据失败', error, event.data);
          // 调用流式错误处理，确保错误能显示在对话中
          const errorMessage = error instanceof Error ? error.message : String(error);
          const userFriendlyMessage = `数据解析失败: ${errorMessage}`;

          if (parser.onStreamError) {
            parser.onStreamError(userFriendlyMessage);
          } else if (parser.onError) {
            parser.onError(new Error(userFriendlyMessage));
          }
        }
      },
      onerror: (error) => {
        console.error('流式请求错误', error);

        // 提供友好的错误消息
        const userFriendlyMessage = '连接中断，请稍后重试';

        if (parser.onStreamError) {
          parser.onStreamError(userFriendlyMessage);
        } else if (parser.onError) {
          parser.onError(new Error(userFriendlyMessage));
        }

        // 不要抛出错误，避免重试导致重复消息
        return; // 结束请求
      },
      onclose: () => {
        // 处理连接正常关闭的情况
        // 清理任务状态
        setCurrentTaskId(null);
        setCurrentAbortController(null);

        if (parser.onDone) {
          parser.onDone();
        }
      },
    });
  } catch (error) {
    console.error('流式请求失败', error);

    // 错误时也要清理任务状态
    setCurrentTaskId(null);
    setCurrentAbortController(null);

    if (parser.onError) {
      parser.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
};

/**
 * 获取历史会话列表
 * @param agentId 智能体ID
 * @returns 会话列表
 */
export const getConversations = async (
  agentId?: string
): Promise<Array<{ id: string; title: string; created_at: string }>> => {
  try {
    const userIdentifier = getUserIdentifier();
    const apiBaseUrl = getCurrentApiBaseUrl();
    const headers = getCurrentRequestHeaders(agentId);

    const response = await apiClient.get(`${apiBaseUrl}/conversations?user=${userIdentifier}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('获取会话列表失败', error);
    throw new Error('获取会话列表失败');
  }
};

/**
 * 获取会话消息历史
 * @param conversationId 会话ID
 * @returns 消息历史
 */
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  query: string;
  answer: string;
  created_at: string;
  user: string;
  files: FileInfo[];
  isHistorical?: boolean;
  isStreaming?: boolean;
  role?: string;
  timestamp?: number;
  content?: string;
}

export interface ConversationMessageItem {
  content: string;
  conversationId: string;
  id: string;
  isHistorical: boolean;
  isStreaming: boolean;
  role: string;
  timestamp: number;
  files: FileInfo[];
}

export const getConversationMessages = async (
  conversationId: string,
  agentId?: string,
  shareUserId?: string
): Promise<Array<ConversationMessageItem>> => {
  try {
    const userIdentifier = shareUserId || getUserIdentifier();
    console.log('userIdentifier', userIdentifier, shareUserId);
    const apiBaseUrl = getCurrentApiBaseUrl();
    const headers = getCurrentRequestHeaders(agentId);

    const response = await apiClient.get(`${apiBaseUrl}/messages`, {
      headers,
      params: {
        conversation_id: conversationId,
        user: userIdentifier,
      },
    });
    // 对数据进行处理
    let messages: ConversationMessageItem[] = [];
    response.data.forEach((item: any) => {
      messages.push({
        content: item.query,
        conversationId: item.conversation_id,
        id: item.id,
        isHistorical: true,
        isStreaming: false,
        files: item.message_files.filter((file: any) => file.belongs_to === 'user') || [],
        role: 'user',
        timestamp: item.created_at,
      });
      messages.push({
        content: item.answer,
        conversationId: item.conversation_id,
        id: item.id,
        isHistorical: true,
        isStreaming: false,
        role: 'assistant',
        files: item.message_files.filter((file: any) => file.belongs_to === 'assistant') || [],
        timestamp: item.created_at,
      });
    });
    return messages;
  } catch (error) {
    if (window.location.href.includes('conversation') && shareUserId === getUserIdentifier()) {
      console.error('获取会话消息失败', error);
      debugger;
      localStorage.removeItem('agentConversation_' + agentId);
      localStorage.removeItem('agent_current_conversation');
      localStorage.removeItem('agent_messages');
      window.location.href = '/agent?id=' + agentId;
    }
    throw new Error('获取会话消息失败');
  }
};

/**
 * 上传文件到Dify API
 * @param file 要上传的文件对象
 * @param agentId 代理ID
 * @returns 上传成功后的文件信息，符合Dify API格式
 */
export const uploadFile = async (
  file: File,
  agentId?: string
): Promise<{ id: string; type: string; name: string; size: number; url?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  // 使用真实用户标识
  const userIdentifier = getUserIdentifier();
  formData.append('user', userIdentifier);

  try {
    const apiBaseUrl = getCurrentApiBaseUrl();
    const headers = getCurrentRequestHeaders(agentId, true);

    const response = await fetch(`/api${apiBaseUrl}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        // 不需要设置Content-Type，fetch会自动设置为multipart/form-data
      },
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }

    const result = await response.json();

    // 确保返回的文件信息符合Dify API格式
    return {
      id: result.id,
      name: result.name || file.name,
      type: result.type || file.type,
      size: result.size || file.size,
      url: result.url,
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

/**
 * 提交消息反馈(点赞/点踩)
 * @param messageId 消息ID
 * @param rating 反馈类型: "like" | "dislike" | null(取消反馈)
 * @param userId 用户ID
 * @param content 可选的反馈内容
 * @returns 反馈结果
 */
export const submitMessageFeedback = async (
  messageId: string,
  rating: 'like' | 'dislike' | null,
  userId: string,
  content: string = ''
): Promise<{ result: string }> => {
  try {
    const apiBaseUrl = getCurrentApiBaseUrl();
    const response = await apiClient.post(`${apiBaseUrl}/messages/${messageId}/feedbacks`, {
      message_id: messageId,
      rating,
      user: userId,
      content,
    });
    return response.data;
  } catch (error) {
    console.error('提交反馈失败', error);
    throw new Error('提交反馈失败');
  }
};

//
export const filePreview = async (fileUrl: string, fileName: string): Promise<{ data: string }> => {
  try {
    const apiBaseUrl = getCurrentApiBaseUrl();
    const response = await apiClient.get(`${apiBaseUrl}/template/preview/${fileUrl}`, {
      params: {
        fileName,
        mobile: getUserIdentifier() || '',
        email: getUserIdentifier() || '',
      },
    });
    return response;
  } catch (error) {
    console.error('提交反馈失败', error);
    throw new Error('提交反馈失败');
  }
};

/**
 * 获取行业列表
 * @returns 行业列表
 */
export const getIndustry = async (): Promise<{ result: string }> => {
  try {
    const response = await apiClient.get(`/market/customer/industry/listAll`, {
      headers: {
        'Content-Type': 'application/json',
        language: i18n.language === 'en' ? 'en' : 'zh',
      },
    });
    return response.data;
  } catch (error) {
    console.error('提交反馈失败', error);
    throw new Error('提交反馈失败');
  }
};
/**
 * 删除会话
 * @param conversationId 会话ID
 * @param agentId 智能体ID
 * @returns 删除结果
 */
export const deleteConversation = async (
  conversationId: string,
  agentId?: string
): Promise<{ result: string }> => {
  try {
    const userIdentifier = getUserIdentifier();
    const apiBaseUrl = getCurrentApiBaseUrl();
    const headers = getCurrentRequestHeaders(agentId);

    const response = await apiClient.delete(`${apiBaseUrl}/conversations/${conversationId}`, {
      headers,
      data: {
        user: userIdentifier,
      },
    });
    return response.data;
  } catch (error) {
    console.error('删除会话失败', error);
    throw new Error('删除会话失败');
  }
};

// 根据Dify API要求转换文件格式
export const formatFilesForDifyAPI = (files: FileInfo[]): any[] => {
  if (!files || files.length === 0) return [];

  return files.map((file) => {
    // 确定文件类型
    let fileType = 'custom';
    if (file.type && file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type && file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.type && file.type.startsWith('video/')) {
      fileType = 'video';
    } else {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (
        [
          'txt',
          'md',
          'markdown',
          'pdf',
          'html',
          'xlsx',
          'xls',
          'docx',
          'csv',
          'eml',
          'msg',
          'pptx',
          'ppt',
          'xml',
          'epub',
        ].includes(extension)
      ) {
        fileType = 'document';
      }
    }

    return {
      type: fileType,
      transfer_method: 'local_file',
      upload_file_id: file.id,
    };
  });
};

/**
 * 获取分享对话的详细信息
 * @param conversationId 会话ID
 * @param shareUserId 分享用户的加密ID
 * @param agentId 智能体ID
 * @returns 分享对话信息
 */
export const getSharedConversation = async (
  conversationId: string,
  shareUserId: string,
  agentId?: string
): Promise<{
  conversation: any;
  messages: Array<ConversationMessageItem>;
  isValid: boolean;
}> => {
  try {
    // 这里可以添加验证分享链接有效性的逻辑
    // 目前直接调用现有的获取消息接口
    const messages = await getConversationMessages(conversationId, agentId, shareUserId);

    return {
      conversation: {
        id: conversationId,
        title: messages.length > 0 ? messages[0].content.substring(0, 50) + '...' : '新对话',
        created_at: messages.length > 0 ? messages[0].timestamp : Date.now(),
      },
      messages,
      isValid: true,
    };
  } catch (error) {
    console.error('获取分享对话失败', error);
    return {
      conversation: null,
      messages: [],
      isValid: false,
    };
  }
};

/**
 * 验证分享链接的有效性
 * @param conversationId 会话ID
 * @param shareUserId 分享用户的加密ID
 * @param agentId 智能体ID
 * @returns 是否有效
 */
export const validateShareLink = async (
  conversationId: string,
  shareUserId: string,
  agentId?: string
): Promise<boolean> => {
  try {
    // 这里可以添加更多的验证逻辑
    // 例如：检查分享链接是否过期、是否被禁用等
    console.log('validateShareLink', conversationId, shareUserId, agentId);
    const result = await getSharedConversation(conversationId, shareUserId, agentId);
    return result.isValid && result.messages.length > 0;
  } catch (error) {
    console.error('验证分享链接失败', error);
    return false;
  }
};
