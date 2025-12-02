import React, { useEffect, useState, useRef } from 'react';
import {
  DifyStreamParser,
  sendStreamingChatMessage,
  formatFilesForDifyAPI,
  getUserIdentifier,
  setCurrentConversation,
} from '../../api/difyStream';
import MessageBubble from './MessageBubble';
import useStreamParser from '../../hooks/useStreamParser';
import { useMessages } from '../../stores/messageStore';
import { FileInfo } from './FileAttachment';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PluginAddInfo } from '../../../../types/api';

interface StreamRendererProps {
  messageId: string;
  agentId: string;
  userInput: string; // 用户输入的查询内容，必须传递
  userFiles?: FileInfo[];
  conversationId?: string;
  onStreamEnd?: (finalContent?: string) => void;
  onContentUpdate?: () => void; // 内容更新时的回调函数
  onConversationIdUpdate?: (conversationId: string) => void; // 会话ID更新时的回调函数
  agentAvatar?: string;
  isLatest?: boolean; // 是否为最新消息
  pluginAddInfo?: PluginAddInfo | null; // 智能体附加信息
}


/**
 * 流式数据渲染组件
 * 接收流式响应并实时渲染
 * 专用于新生成的消息，始终启用打字机效果
 */
const StreamRenderer: React.FC<StreamRendererProps> = ({
  messageId,
  agentId,
  userInput,
  userFiles,
  onStreamEnd,
  onContentUpdate,
  onConversationIdUpdate,
  agentAvatar,
  isLatest = true, // 默认为最新消息
  pluginAddInfo
}) => {
  // 路径
  const [searchParams] = useSearchParams();
  const searchConversationId = searchParams.get('conversation') || "";
  const { appendToMessage, setStreamingStatus, messages } = useMessages();
  const [isComplete, setIsComplete] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(searchConversationId || "");
  const [isThinking, setIsThinking] = useState(false); // 新增：思考状态
  const streamStartedRef = useRef(false);
  const streamFailedRef = useRef(false); // 添加失败状态标记
  const displayContentRef = useRef<string>('');

  const { t } = useTranslation()

  const navigate = useNavigate();

  // 使用流式解析Hook
  const { isStreaming, isThinking: streamThinking, error, createParser } = useStreamParser({
    onThinking: () => {
      console.log('StreamRenderer: 开始思考状态');
      setIsThinking(true);
    },
    onMessageStart: () => {
      console.log('StreamRenderer: 开始输出消息');
      setIsThinking(false);
    },
    onStreamError: (errorMessage: string) => {
      console.error('StreamRenderer: 流式错误:', errorMessage);

      // 标记为失败状态，防止重复调用
      streamFailedRef.current = true;

      setStreamError(errorMessage);
      setIsThinking(false);
      setStreamingStatus(messageId, false);

      // 在消息内容中显示错误
      const errorContent = streamContent + `\n\n[${errorMessage}]`;
      appendToMessage(messageId, `\n\n[${errorMessage}]`);

      if (onStreamEnd) {
        // 传递包含错误信息的最终内容
        setTimeout(() => {
          onStreamEnd(errorContent);
        }, 1000);
      }
    },
    onDone: () => {
      console.log('Stream completed successfully for message:', messageId);
      setIsComplete(true);
      setIsThinking(false);
      setStreamingStatus(messageId, false);
      if (onStreamEnd) {
        setTimeout(() => {
          onStreamEnd(displayContentRef.current);
        }, 1000);
      }
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('流式渲染错误:', errorMessage);

      // 标记为失败状态，防止重复调用
      streamFailedRef.current = true;

      // 提供友好的错误提示
      const userFriendlyMessage = '连接中断，消息接收失败';
      setStreamError(userFriendlyMessage);
      setIsThinking(false);
      setStreamingStatus(messageId, false);

      // 在消息内容中显示错误
      const errorContent = streamContent + `\n\n[${userFriendlyMessage}]`;
      appendToMessage(messageId, `\n\n[${userFriendlyMessage}]`);

      if (onStreamEnd) {
        // 传递包含错误信息的最终内容
        setTimeout(() => {
          onStreamEnd(errorContent);
        }, 1000);
      }
    },

  });

  // 获取当前消息
  const currentMessage = messages.find(
    (msg) => msg.id === messageId || msg.conversationId === messageId
  );

  // 创建流式解析器
  useEffect(() => {
    if (streamStartedRef.current || streamFailedRef.current) return; // 避免重复启动流或失败后重复调用

    // 验证用户输入
    if (!userInput || userInput.trim() === '') {
      console.error('错误：必须提供用户输入查询内容');
      const errorMsg = '请输入消息内容';
      setStreamError(errorMsg);
      streamFailedRef.current = true; // 标记为失败状态
      if (onStreamEnd) {
        onStreamEnd(`[错误: ${errorMsg}]`);
      }
      return;
    }

    streamStartedRef.current = true;

    // 创建流式解析器
    const streamParser: DifyStreamParser = createParser(
      // 流式内容回调
      (content: string) => {
        appendToMessage(messageId, content);

        // 更新本地显示内容
        setStreamContent((prevContent) => prevContent + content);

        // 调用内容更新回调
        if (onContentUpdate) {
          onContentUpdate();
        }
      },
      messageId
    );

    // 增强数据回调以处理会话ID
    const enhancedStreamParser: DifyStreamParser = {
      ...streamParser,
      onData: (data: any) => {
        // 如果是第一条消息且没有会话ID，则从响应中获取会话ID
        if (
          data &&
          data.conversation_id &&
          !searchConversationId &&
          !localStorage?.getItem('agent_current_conversation')
        ) {
          console.log('从响应中获取会话ID:', data.conversation_id);

          // 原路径：构建URL参数，保持分享相关参数
          const currentParams = new URLSearchParams(window.location.search);
          const newParams = new URLSearchParams();

          // 保持必要的参数
          newParams.set('id', agentId || '');
          newParams.set('conversation', data.conversation_id);
          newParams.set('chainmeetShare', localStorage.getItem('agent_share_str_url') || '');

          // 保持分享相关参数
          if (currentParams.get('shareUserId')) {
            newParams.set('shareUserId', currentParams.get('shareUserId') || '');
          }
          if (currentParams.get('isShared')) {
            newParams.set('isShared', currentParams.get('isShared') || '');
          }

          // 使用replaceState避免页面重新渲染
          navigate(`/agent?id=${agentId}&conversation=${data.conversation_id}`);
          localStorage.setItem('agent_current_conversation', data.conversation_id);
          setCurrentConversation(data.conversation_id);
          setConversationId(data.conversation_id);
          
          // 通知父组件会话ID已更新
          if (onConversationIdUpdate) {
            onConversationIdUpdate(data.conversation_id);
          }
          // debugger;
        }

        // 调用原始onData回调
        if (streamParser.onData) {
          streamParser.onData(data);
        }
      },
    };

    // 设置正在流式处理状态
    setStreamingStatus(messageId, true);

    // 准备文件信息
    const formattedFiles =
      userFiles && userFiles.length > 0 ? formatFilesForDifyAPI(userFiles) : undefined;

    // 使用真实的sendStreamingChatMessage调用

    sendStreamingChatMessage(
      agentId,
      userInput.trim(), // 确保传递用户输入并去除前后空格
      enhancedStreamParser,
      conversationId || undefined, // 转换为string | undefined类型
      formattedFiles,
      pluginAddInfo // 传递智能体附加信息
    ).catch((error) => {
      console.error('流式请求失败', error);

      // 标记为失败状态，防止重复调用
      streamFailedRef.current = true;

      // 根据错误类型提供友好的错误提示
      let userFriendlyMessage = '消息发送失败';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userFriendlyMessage = '网络连接失败，请检查网络连接后重试';
        } else if (errorMsg.includes('timeout')) {
          userFriendlyMessage = '请求超时，请稍后重试';
        } else if (errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
          userFriendlyMessage = '身份验证失败，请重新登录';
        } else if (errorMsg.includes('forbidden') || errorMsg.includes('403')) {
          userFriendlyMessage = '没有权限访问该功能';
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          userFriendlyMessage = '智能助手不存在或已被删除';
        } else if (errorMsg.includes('500') || errorMsg.includes('server')) {
          userFriendlyMessage = '服务器错误，请稍后重试';
        } else if (errorMsg.includes('parameter') || errorMsg.includes('param')) {
          userFriendlyMessage = '参数错误，请检查输入内容';
        } else {
          userFriendlyMessage = `请求失败: ${error.message}`;
        }
      }

      setStreamError(userFriendlyMessage);

      // 在消息内容中显示错误
      const errorContent = `[${userFriendlyMessage}]`;
      appendToMessage(messageId, errorContent);

      // 调用流式解析器的错误回调
      if (streamParser.onError) {
        streamParser.onError(error);
      }

      // 调用结束回调
      if (onStreamEnd) {
        onStreamEnd(errorContent);
      }
    });

    return () => {
      // 清理流式状态
      setStreamingStatus(messageId, false);
    };
  }, [
    messageId,
    agentId,
    userInput,
    conversationId,
    userFiles,
    createParser,
    appendToMessage,
    setStreamingStatus,
    onContentUpdate,
  ]);

  // 如果找不到消息，返回占位符
  // if (!currentMessage && !streamContent && !isThinking) {
  //   return (
  //     <MessageBubble
  //       content="内容生成错误，请创建新对话或者联系客服"
  //       isUser={false}
  //       isStreaming={true}
  //       agentAvatar={agentAvatar}
  //       messageId={messageId}
  //       userId={getUserIdentifier()}
  //       isLatest={isLatest}
  //     />
  //   );
  // }

  // 使用当前流式内容或消息内容
  let displayContent = '';

  if (isThinking) {
    // 处于思考状态时显示思考提示
    displayContent = t('agent.inThink');
  } else {
    // 正常显示内容
    displayContent = streamContent || (currentMessage ? currentMessage.content : '');
  }

  displayContentRef.current = displayContent;

  return (
    <MessageBubble
      content={displayContent}
      isUser={false}
      isStreaming={!isComplete}
      error={streamError}
      files={currentMessage?.files}
      agentAvatar={agentAvatar}
      messageId={messageId}
      userId={getUserIdentifier()}
      isLatest={isLatest}
    />
  );
};

// 使用React.memo优化性能，但流式渲染需要更新，所以比较规则较宽松
export default React.memo(StreamRenderer, (prevProps, nextProps) => {
  // 对于流式渲染，messageId变化或agentId变化时才重新渲染
  // 其他props的变化通常不需要重新渲染整个组件
  return (
    prevProps.messageId === nextProps.messageId &&
    prevProps.agentId === nextProps.agentId &&
    prevProps.userInput === nextProps.userInput &&
    JSON.stringify(prevProps.userFiles) === JSON.stringify(nextProps.userFiles)
  );
});
