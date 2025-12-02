// 消息管理钩子
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMessages, Message } from '../../../stores/messageStore';
import { formatFilesForDifyAPI, getUserIdentifier, getCurrentTaskId, stopStreamingResponse } from '../../../api/difyStream';
import { FileInfo } from '../FileAttachment';
import blobManager from '../../../../../utils/blobManager';

/**
 * 节流函数 - 优化老设备性能
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 */
const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= delay) {
      func(...args);
      lastRun = now;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastRun = Date.now();
      }, delay - (now - lastRun));
    }
  };
};

export interface CurrentInputData {
  messageId: string;
  content: string;
  files?: FileInfo[];
}

interface UseMessageManagementProps {
  agentId: string;
  conversationId?: string | null;
  onFirstUserMessage?: (message: string) => void;
}

/**
 * 消息管理钩子
 *
 * @param props 配置选项
 */
const useMessageManagement = (props: UseMessageManagementProps) => {
  const { agentId, conversationId = '', onFirstUserMessage } = props;
  const { messages: localMessages, addMessage } = useMessages();

  // 状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [currentInputData, setCurrentInputData] = useState<CurrentInputData | null>(null);
  const [displayMessages, setDisplayMessages] = useState<any[]>([]);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isCurrentlyStreaming, setIsCurrentlyStreaming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // refs
  const oldDisplayMessages = useRef<any[]>([]);
  const updateQueueRef = useRef<(() => void)[]>([]);
  const isProcessingRef = useRef(false);

  // 批量处理消息更新 - 优化老设备性能
  const processBatchUpdates = useCallback(() => {
    if (isProcessingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    
    requestAnimationFrame(() => {
      const updates = [...updateQueueRef.current];
      updateQueueRef.current = [];
      
      updates.forEach(update => update());
      
      isProcessingRef.current = false;
      
      // 如果还有待处理的更新，继续处理
      if (updateQueueRef.current.length > 0) {
        processBatchUpdates();
      }
    });
  }, []);

  // 队列式更新消息 - 避免频繁更新导致卡顿
  const queueMessageUpdate = useCallback((updateFn: () => void) => {
    updateQueueRef.current.push(updateFn);
    processBatchUpdates();
  }, [processBatchUpdates]);

  // 发送消息
  const sendMessage = async (content: string, files?: FileInfo[]) => {
    if (!content.trim() || isSubmitting) return null;

    try {
      setIsSubmitting(true);

      // 保存当前用户输入内容
      let currentInput = content.trim();

      // 如果是第一条消息，调用回调函数
      if (isFirstMessage && onFirstUserMessage && currentInput) {
        onFirstUserMessage(currentInput);
        setIsFirstMessage(false);
      }

      // 发送消息时重新启用自动滚动
      // setShouldAutoScroll(true); // 这个应该在外部处理

      // 生成绝对唯一ID
      const timestamp = Date.now();
      const randomPart =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const userMsgId = `user_${timestamp}_${randomPart}`;
      const aiMsgId = `assistant_${timestamp + 1}_${randomPart}`;

      // 过滤掉仍在上传的文件
      const readyFiles = files?.filter((file) => !(file as any).isUploading);

      setDisplayMessages(oldDisplayMessages.current);

      // 为文件增加blob引用计数（因为消息会使用这些blob URL）
      readyFiles?.forEach(file => {
        if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
          blobManager.retainBlobUrl(file.id);
        }
      });

      // 创建用户消息
      const userMessage: Message = {
        role: 'user',
        content: currentInput,
        conversationId: conversationId || '',
        timestamp: Date.now(),
        id: userMsgId,
        files: readyFiles?.length ? [...readyFiles] : undefined,
      };

      // 创建AI响应占位消息
      const aiMessage: Message = {
        role: 'assistant',
        content: '',
        isStreaming: true,
        conversationId: conversationId || '',
        timestamp: Date.now(),
        id: aiMsgId,
      };
      console.log('conversationId', conversationId);
      // 更新显示的消息
      setDisplayMessages((prev) => [...prev, userMessage, aiMessage]);
      // 添加到消息存储中
      addMessage(userMessage);
      addMessage(aiMessage);

      // 设置当前正在流式传输状态
      setIsCurrentlyStreaming(true);
      setIsGenerating(true);

      // 保存当前消息ID和对应的用户输入
      setCurrentInputData({
        messageId: aiMessage.id,
        content: currentInput,
        files: readyFiles,
      });

      // setTimeout(() => {
      //   if(document.querySelector('#chat-messages-container')){
      //     document.querySelector('#chat-messages-container')?.scrollTo({
      //       top: document.querySelector('#chat-messages-container')?.scrollHeight,
      //       behavior: 'smooth'
      //     });
      //   }
      // }, 100);

      // 设置当前流式消息ID
      setCurrentStreamId(aiMessage.id);

      return {
        userMessageId: userMsgId,
        aiMessageId: aiMsgId,
        conversationId: aiMessage.conversationId,
      };
    } catch (error) {
      console.error('发送消息失败', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
 
  // 处理流式内容结束
  const handleStreamEnd = useCallback(
    (messageId: string, finalContent: string) => {
      // 流结束后清除当前输入数据
      if (currentInputData && currentInputData.messageId === messageId) {
        setCurrentInputData(null);
      }

      // console.log('handleStreamEnd', messageId, finalContent, oldDisplayMessages.current);
      // debugger;

      // 设置流结束状态
      setIsCurrentlyStreaming(false);
      setIsGenerating(false);

      // 更新引用的旧消息
      oldDisplayMessages.current = oldDisplayMessages.current.map((m) =>
        m.id === messageId
          ? {
              ...m,
              isStreaming: false,
              content: finalContent || m.content,
            }
          : m
      );

      // console.log('handleStreamEnd', oldDisplayMessages.current);
      // debugger;
    },
    [currentInputData]
  );

  // 加载历史消息
  const loadHistoryMessages = useCallback(
    (historyMessages: any[]) => {
      if (historyMessages && historyMessages.length > 0 && !historyLoaded) {
        setDisplayMessages(historyMessages);
        oldDisplayMessages.current = historyMessages;
        setHistoryLoaded(true);

        // 如果有历史消息，则不是第一条消息
        setIsFirstMessage(false);
      }
    },
    [historyLoaded]
  );

  useEffect(() => {
    oldDisplayMessages.current = displayMessages;
  }, [displayMessages]);

  // 停止当前生成
  const stopGeneration = useCallback(async () => {
    const taskId = getCurrentTaskId();
    if (!taskId || !isGenerating) {
      return;
    }

    try {
      await stopStreamingResponse(taskId, agentId);
      
      // 重置生成状态
      setIsGenerating(false);
      setIsCurrentlyStreaming(false);
      
      // 如果有当前流的消息，标记为停止
      if (currentStreamId) {
        // 同时更新引用的旧消息
        oldDisplayMessages.current = oldDisplayMessages.current.map(msg =>
          msg.id === currentStreamId
            ? { ...msg, content: msg.content + '\n\n[生成已停止]', isStreaming: false }
            : msg
        );
      }
      
      console.log('生成已成功停止');
    } catch (error) {
      console.error('停止生成失败:', error);
      // 即使停止失败，也要重置状态，防止UI卡住
      setIsGenerating(false);
      setIsCurrentlyStreaming(false);
    }
  }, [agentId, isGenerating, currentStreamId]);

  // 重置消息状态（如新会话）
  const resetMessageState = useCallback(() => {
    // 如果正在生成，先停止
    if (isGenerating) {
      stopGeneration();
    }
    
    setDisplayMessages([]);
    oldDisplayMessages.current = [];
    setHistoryLoaded(false);
    setIsFirstMessage(true);
    setCurrentStreamId(null);
    setCurrentInputData(null);
    setIsCurrentlyStreaming(false);
    setIsGenerating(false);
  }, [isGenerating, stopGeneration]);

  // 监听conversationId变化，适当重置状态
  useCallback(() => {
    if (!conversationId) {
      // 没有会话ID时，清空消息显示，准备新对话
      resetMessageState();
    }
  }, [conversationId, resetMessageState]);

  return {
    displayMessages,
    setDisplayMessages,
    isSubmitting,
    currentStreamId,
    currentInputData,
    isCurrentlyStreaming,
    isFirstMessage,
    isGenerating,
    sendMessage,
    handleStreamEnd,
    loadHistoryMessages,
    resetMessageState,
    stopGeneration,
  };
};

export default useMessageManagement;
