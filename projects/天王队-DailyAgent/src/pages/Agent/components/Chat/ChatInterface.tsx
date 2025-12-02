import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MessageBubble from './MessageBubble';
import StreamRenderer from './StreamRenderer';
import StaticMessage from './StaticMessage';
import {
  ConversationMessage,
  getUserIdentifier,
  cleanupStreamingState,
} from '../../api/difyStream';
import { formSubmitEvent } from '../../utils/formSubmitEvent';
import ChatInput from './components/ChatInput';
import EmptyChatState from './components/EmptyChatState';
import SuggestedQuestions from './components/SuggestedQuestions';
import { ShareInfo } from '../../../../utils/shareUtils';
import { PluginAddInfo } from '../../../../types/api';

// Hooks
import useScrollManagement from './hooks/useScrollManagement';
import useFileUpload from './hooks/useFileUpload';
import useInputHandling from './hooks/useInputHandling';
import useQuestionSuggestions from './hooks/useQuestionSuggestions';
import useMessageManagement from './hooks/useMessageManagement';

// Utils
import { isMobileDevice, isIOSDevice, isAndroidDevice } from './utils/deviceDetection';
import { getPlainTextContent, focusEditableDiv } from './utils/domHelpers';
import { 
  getCurrentPerformanceConfig, 
  rafThrottle,
  BatchProcessor 
} from './utils/performanceOptimizer';

import './ChatInterface.scss';

interface ChatInterfaceProps {
  agentId: string;
  className?: string;
  historyMessages?: ConversationMessage[];
  onFirstUserMessage?: (message: string) => void;
  onConversationIdUpdate?: (conversationId: string) => void; // 会话ID更新时的回调函数
  currentAgent?: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
  scenarioType?: 'general' | 'sales';
  shareInfo?: ShareInfo;
  onStartNewChatFromShare?: () => void;
  pluginAddInfo?: PluginAddInfo | null; // 从父组件传递的智能体附加信息
  onMessageManagerReady?: (messageManager: any) => void; // 消息管理器准备就绪时的回调
}

/**
 * 聊天界面组件
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agentId,
  className = '',
  historyMessages = [],
  onFirstUserMessage,
  onConversationIdUpdate,
  currentAgent,
  scenarioType = 'general',
  shareInfo = { isShared: false, isOwner: true },
  onStartNewChatFromShare,
  pluginAddInfo: propPluginAddInfo,
  onMessageManagerReady,
}) => {
  // 初始化参数和引用
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = isMobileDevice();
  const { t } = useTranslation();
  
  // 使用从父组件传递的智能体附加信息
  const pluginAddInfo = propPluginAddInfo;

  const fileUploader = useFileUpload(agentId);

  const messageManager = useMessageManagement({
    agentId,
    conversationId,
    onFirstUserMessage,
  });

  const inputHandler = useInputHandling({
    agentName: currentAgent?.name,
    onSubmit: (content) => {
      // 这里不处理提交，由 handleSubmit 统一处理
      // 避免重复逻辑
    },
  });

  const questionSuggestions = useQuestionSuggestions({
    scenarioType,
    agentName: currentAgent?.name,
    isGenerating: messageManager.isGenerating,
    isSubmitting: messageManager.isSubmitting,
    isUploading: fileUploader.isUploading,
    attachments: fileUploader.attachments,
    setInputContent: (content: string) => {
      inputHandler.setUserInput(content);
      if (inputHandler.editableDivRef.current) {
        inputHandler.editableDivRef.current.textContent = content;
      }
    },
    editableDivRef: inputHandler.editableDivRef,
    onSendMessage: (message) => {
      // 直接发送消息，不设置输入框内容（send类型是直接发送的）
      const files = fileUploader.getReadyAttachments();
      messageManager.sendMessage(message, files);

      // 清空输入框和附件（与手动输入发送保持一致）
      inputHandler.clearInput();
      fileUploader.clearAttachments();

      // 重置问题选中状态
      questionSuggestions.resetSelection(inputHandler.editableDivRef.current || undefined);
    },
  });

  // 处理可编辑div内容变化
  const handleEditableChange = () => {
    if (inputHandler.editableDivRef.current) {
      const fullContent = getPlainTextContent(inputHandler.editableDivRef.current);
      inputHandler.setUserInput(fullContent);
    }
  };

  // 设置视口高度变量，解决移动端键盘弹出问题
  useEffect(() => {
    const setViewportHeight = () => {
      // 设置自定义视口高度属性
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 初始设置
    setViewportHeight();

    // 在调整大小和方向变化时更新
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  // 将messageManager传递给父组件
  useEffect(() => {
    if (onMessageManagerReady) {
      onMessageManagerReady(messageManager);
    }
  }, [messageManager, onMessageManagerReady]);

  // 监听表单提交事件
  useEffect(() => {
    const unsubscribe = formSubmitEvent.subscribe(({ formattedMessage }) => {
      if (formattedMessage) {
        messageManager.sendMessage(formattedMessage);
      }
    });

    return unsubscribe;
  }, []);

  // 在组件初始化时初始化推荐问题
  useEffect(() => {
    questionSuggestions.initializeQuestions();
  }, []);

  // PluginAddInfo 现在从父组件传递，不再需要在这里获取

  // 外部会话ID变更时更新
  useEffect(() => {
    if (!conversationId) {
      messageManager.resetMessageState();
    }
  }, [conversationId]);

  // 页面离开时清理生成状态
  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     // 如果正在生成，尝试停止
  //     if (messageManager.isGenerating) {
  //       messageManager.stopGeneration();
  //     }
  //   };

  //   const handleVisibilityChange = () => {
  //     // 页面隐藏时停止生成
  //     if (document.hidden && messageManager.isGenerating) {
  //       messageManager.stopGeneration();
  //     }
  //   };

  //   // 监听页面离开事件
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   document.addEventListener('visibilitychange', handleVisibilityChange);

  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //   };
  // }, [messageManager.isGenerating, messageManager.stopGeneration]);

  // 当传入历史消息时加载
  useEffect(() => {
    console.log('historyMessages123', historyMessages);
    messageManager.loadHistoryMessages(historyMessages);
  }, [historyMessages]);

  // agentId变化时停止当前生成
  useEffect(() => {
    if (messageManager.isGenerating) {
      messageManager.stopGeneration();
    }
  }, [agentId]);

  // 组件卸载时清理流式请求状态
  useEffect(() => {
    return () => {
      cleanupStreamingState();
    };
  }, []);

  // 处理问题点击
  const handleQuestionClick = (question: any) => {
    // 保存当前焦点状态
    const wasFocused = document.activeElement === inputHandler.editableDivRef.current;
    
    questionSuggestions.handleQuestionClick(
      question,
      inputHandler.editableDivRef.current || undefined
    );

    // 如果之前有焦点，确保焦点保持
    if (wasFocused && inputHandler.editableDivRef.current) {
      // 使用 requestAnimationFrame 确保DOM更新完成后再聚焦
      requestAnimationFrame(() => {
        if (inputHandler.editableDivRef.current) {
          if (isMobile) {
            focusEditableDiv(inputHandler.editableDivRef.current);
          } else {
            inputHandler.editableDivRef.current.focus();
          }
        }
      });
    }
  };

  // 验证输入框占位符是否有效
  const validatePlaceholders = (): boolean => {
    return inputHandler.userInput.trim() !== '';
  };

  // 处理按钮提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !inputHandler.userInput.trim() ||
      messageManager.isSubmitting ||
      fileUploader.isUploading ||
      messageManager.isGenerating
    )
      return;

    // 检查是否有选中的问题，如果有则添加到内容前面
    let content = inputHandler.userInput.trim();
    const selectedQuestion = questionSuggestions.suggestedQuestions.find(
      (q) => q.id === questionSuggestions.selectedQuestionId
    );
    if (selectedQuestion && selectedQuestion.name) {
      content = `${selectedQuestion.name}：${content}`;
    }

    // 发送消息
    const files = fileUploader.getReadyAttachments();
    messageManager.sendMessage(content, files);

    // 清空输入框和附件
    inputHandler.clearInput();
    fileUploader.clearAttachments();

    // 重置问题选中状态
    questionSuggestions.resetSelection(inputHandler.editableDivRef.current || undefined);

    // 在移动端，发送消息后处理焦点
    setTimeout(() => {
      if (isMobile && inputRef.current) {
        // 移动设备上，先隐藏键盘
        inputRef.current.blur();

        // 处理iOS上的问题，确保视图恢复正常
        // if (isIOSDevice()) {
        //   // 为iOS设备滚动到顶部，修复iOS键盘消失后的布局问题
        //   window.scrollTo(0, 0);
        //   document.body.scrollTop = 0; // 对于旧版iOS

        // }

        // 短暂延迟后，只有在非空聊天时才重新聚焦
        setTimeout(() => {
          if (messageManager.displayMessages.length > 0 && inputRef.current) {
            inputRef.current.focus();
          }
        }, 300);
      } else {
        // 非移动设备，直接聚焦
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, 100);
  };

  // 使用useCallback优化渲染函数，避免不必要的重新创建
  const renderUserMessage = useCallback((message: any) => {
    return (
      <MessageBubble
        key={`${message.id}_user`}
        content={message.content}
        isUser={true}
        files={message.files}
        agentAvatar={currentAgent?.avatar}
        messageId={message.id}
        userId={getUserIdentifier()}
      />
    );
  }, [currentAgent?.avatar]);

  // 渲染助手消息
  const renderAssistantMessage = useCallback((message: any) => {
    // 如果是当前正在流式输出的消息
    if (message.id === messageManager.currentStreamId) {
      // 优先使用保存的用户输入，如果没有则回退到查找最近的用户消息
      let userInputContent = '';
      let userInputFiles: any[] | undefined = undefined;

      if (
        messageManager.currentInputData &&
        messageManager.currentInputData.messageId === message.id
      ) {
        userInputContent = messageManager.currentInputData.content;
        userInputFiles = messageManager.currentInputData.files;
      } else {
        // 回退方案：查找最近的用户消息
        const latestUserMessage = messageManager.displayMessages
          .filter((m) => m.role === 'user' && m.timestamp < message.timestamp)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (latestUserMessage) {
          userInputContent = latestUserMessage.content;
          userInputFiles = latestUserMessage.files;
        }
      }

      return (
        <StreamRenderer
          key={`${message.id}_stream`}
          messageId={message.id}
          agentId={agentId}
          userInput={userInputContent}
          userFiles={userInputFiles}
          onContentUpdate={() => {}}
          onConversationIdUpdate={onConversationIdUpdate}
          onStreamEnd={(finalContent) => {
            messageManager.handleStreamEnd(message.id, finalContent || '');
          }}
          agentAvatar={currentAgent?.avatar}
          pluginAddInfo={pluginAddInfo}
        />
      );
    }

    // 如果是历史消息（从本地存储加载的），使用StaticMessage组件
    if (message.isHistorical) {
      return (
        <StaticMessage
          key={`${message.id}_static`}
          content={message.content}
          isUser={false}
          files={message.files}
          agentAvatar={currentAgent?.avatar}
          messageId={message.id}
          userId={getUserIdentifier()}
        />
      );
    }

    // 其他情况（已完成生成的消息），使用普通MessageBubble
    return (
      <MessageBubble
        key={`${message.id}_assistant`}
        content={message.content}
        isUser={false}
        isStreaming={false}
        files={message.files}
        agentAvatar={currentAgent?.avatar}
        messageId={message.id}
        userId={getUserIdentifier()}
      />
    );
  }, [
    agentId,
    currentAgent?.avatar,
    messageManager.currentStreamId,
    messageManager.currentInputData,
    messageManager.displayMessages,
    messageManager.handleStreamEnd,
    onConversationIdUpdate,
    pluginAddInfo
  ]);

  // 获取设备性能配置
  const performanceConfig = useMemo(() => getCurrentPerformanceConfig(), []);
  
  // 批处理器用于优化DOM更新
  const batchProcessorRef = useRef<BatchProcessor>(new BatchProcessor());

  // 优化消息滚动 - 使用 requestAnimationFrame 避免老设备卡顿
  const scrollToBottomRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 使用RAF节流的滚动函数 - 根据设备性能优化
  const smoothScrollToBottom = useCallback(
    rafThrottle(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        
        if (performanceConfig.enableSmoothScroll) {
          // 高性能设备使用平滑滚动
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          // 低性能设备直接滚动，避免动画开销
          container.scrollTop = container.scrollHeight;
        }
      }
    }),
    [performanceConfig.enableSmoothScroll]
  );

  // 监听消息变化并自动滚动到底部 - 根据设备性能调整延迟
  useEffect(() => {
    if (messageManager.displayMessages.length > 0) {
      // 使用批处理器优化更新
      batchProcessorRef.current.add(() => {
        smoothScrollToBottom();
      });
    }
  }, [messageManager.displayMessages.length, smoothScrollToBottom]);

  // 组件卸载时清理资源
  useEffect(() => {
    const batchProcessor = batchProcessorRef.current;
    
    return () => {
      if (scrollToBottomRef.current !== null) {
        cancelAnimationFrame(scrollToBottomRef.current);
      }
      if (smoothScrollToBottom.cancel) {
        smoothScrollToBottom.cancel();
      }
      batchProcessor.clear();
    };
  }, [smoothScrollToBottom]);

  // 检查是否是空聊天
  const isEmptyChat = messageManager.displayMessages.length === 0;

  console.log('isEmptyChat123', historyMessages, isEmptyChat, messageManager);

  // 检查是否是分享模式且非所有者（只读模式）
  const isReadOnlyMode = shareInfo.isShared && !shareInfo.isOwner;

  // 使用useMemo优化消息渲染 - 避免每次都重新map
  const renderedMessages = useMemo(() => {
    return messageManager.displayMessages.map((message) =>
      message.role === 'user' ? renderUserMessage(message) : renderAssistantMessage(message)
    );
  }, [messageManager.displayMessages, renderUserMessage, renderAssistantMessage]);

  return (
    <div className={`chat-interface ${className} ${isReadOnlyMode ? 'readonly-mode' : ''}`}>
      <div 
        className="chat-messages-container" 
        id="chat-messages-container"
        ref={messagesContainerRef}
      >
        <div className="chat-messages">
          {isEmptyChat ? (
            // 空聊天状态 - 在只读模式下不显示输入框
            <EmptyChatState
              agentName={currentAgent?.name}
              agentDescription={currentAgent?.description}
              agentAvatar={currentAgent?.avatar}
              suggestedQuestions={isReadOnlyMode ? [] : questionSuggestions.suggestedQuestions}
              onQuestionClick={isReadOnlyMode ? () => {} : handleQuestionClick}
              selectedQuestionId={questionSuggestions.selectedQuestionId}
              disabled={isReadOnlyMode || questionSuggestions.isDisabled}
              // ChatInput props - 在只读模式下禁用
              userInput={isReadOnlyMode ? '' : inputHandler.userInput}
              setUserInput={isReadOnlyMode ? () => {} : inputHandler.setUserInput}
              attachments={isReadOnlyMode ? [] : fileUploader.attachments}
              isSubmitting={messageManager.isSubmitting}
              isUploading={fileUploader.isUploading}
              isGenerating={messageManager.isGenerating}
              handleSubmit={isReadOnlyMode ? () => {} : handleSubmit}
              handleInputChange={isReadOnlyMode ? () => {} : inputHandler.handleInputChange}
              handleKeyDown={isReadOnlyMode ? () => {} : inputHandler.handleKeyDown}
              handleVoiceInput={
                isReadOnlyMode ? () => {} : (text) => inputHandler.setInputWithDOM(text)
              }
              handleAttachClick={isReadOnlyMode ? () => {} : fileUploader.handleAttachClick}
              handleRemoveFile={isReadOnlyMode ? () => {} : fileUploader.handleRemoveFile}
              handleFileUpload={isReadOnlyMode ? () => {} : fileUploader.handleFileUpload}
              handleStopGeneration={messageManager.stopGeneration}
              getUploadProgressData={fileUploader.getUploadProgressData}
              agentId={agentId}
              inputRef={inputRef}
              fileInputRef={fileUploader.fileInputRef}
              editableDivRef={inputHandler.editableDivRef}
              isMobile={isMobile}
              handleEditableChange={isReadOnlyMode ? () => {} : handleEditableChange}
              validatePlaceholders={validatePlaceholders}
              isReadOnly={isReadOnlyMode}
            />
          ) : (
            // 有消息时的展示 - 使用优化后的渲染列表
            renderedMessages
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 分享模式且非所有者时显示"开始新对话"按钮 */}
      {/* {isReadOnlyMode && !isEmptyChat && (
        <div className="readonly-bottom-section">
          <div className="readonly-tip">
            这是一个分享的对话，您正在查看与{currentAgent?.name}的聊天记录
          </div>
          <button 
            className="start-new-chat-button"
            onClick={onStartNewChatFromShare}
          >
            开始新对话
          </button>
        </div>
      )} */}
      {/* 在有消息状态下且非只读模式，输入框显示在底部 */}
      {!isEmptyChat && !isReadOnlyMode && isMobile && (
        <div className="mobile-input-container">
          {/* 在输入框上方显示预设问题 */}
          <ChatInput
            userInput={inputHandler.userInput}
            setUserInput={inputHandler.setUserInput}
            attachments={fileUploader.attachments}
            isSubmitting={messageManager.isSubmitting}
            isUploading={fileUploader.isUploading}
            isGenerating={messageManager.isGenerating}
            handleSubmit={handleSubmit}
            handleInputChange={inputHandler.handleInputChange}
            handleKeyDown={inputHandler.handleKeyDown}
            handleVoiceInput={(text) => inputHandler.setInputWithDOM(text)}
            handleAttachClick={fileUploader.handleAttachClick}
            handleRemoveFile={fileUploader.handleRemoveFile}
            handleFileUpload={fileUploader.handleFileUpload}
            handleStopGeneration={messageManager.stopGeneration}
            getUploadProgressData={fileUploader.getUploadProgressData}
            agentId={agentId}
            inputRef={inputRef}
            className="mobile-centered"
            fileInputRef={fileUploader.fileInputRef}
            editableDivRef={inputHandler.editableDivRef}
            agentName={currentAgent?.name}
            suggestedQuestions={
              <SuggestedQuestions
                questions={questionSuggestions.suggestedQuestions}
                onQuestionClick={handleQuestionClick}
                selectedQuestionId={questionSuggestions.selectedQuestionId}
                disabled={questionSuggestions.isDisabled}
              />
            }
            isMobile={isMobile}
            handleEditableChange={handleEditableChange}
            validatePlaceholders={validatePlaceholders}
          />
          
          {/* AI生成内容提示语 - 移动端 */}
          <div className="ai-generated-disclaimer">
            {t('common.aiGeneratedDisclaimer')}
          </div>
        </div>
      )}
      {/* 在有消息状态下且非只读模式，输入框显示在底部 */}
      {!isEmptyChat && !isReadOnlyMode && !isMobile && (
        <div className="bottom-input-section">
          {/* 在输入框上方显示预设问题 */}
          <SuggestedQuestions
            questions={questionSuggestions.suggestedQuestions}
            onQuestionClick={handleQuestionClick}
            selectedQuestionId={questionSuggestions.selectedQuestionId}
            disabled={questionSuggestions.isDisabled}
          />
          <ChatInput
            userInput={inputHandler.userInput}
            setUserInput={inputHandler.setUserInput}
            attachments={fileUploader.attachments}
            isSubmitting={messageManager.isSubmitting}
            isUploading={fileUploader.isUploading}
            isGenerating={messageManager.isGenerating}
            handleSubmit={handleSubmit}
            handleInputChange={inputHandler.handleInputChange}
            handleKeyDown={inputHandler.handleKeyDown}
            handleVoiceInput={(text) => inputHandler.setInputWithDOM(text)}
            handleAttachClick={fileUploader.handleAttachClick}
            handleRemoveFile={fileUploader.handleRemoveFile}
            handleFileUpload={fileUploader.handleFileUpload}
            handleStopGeneration={messageManager.stopGeneration}
            getUploadProgressData={fileUploader.getUploadProgressData}
            agentId={agentId}
            inputRef={inputRef}
            className="centered"
            fileInputRef={fileUploader.fileInputRef}
            editableDivRef={inputHandler.editableDivRef}
            agentName={currentAgent?.name}
            isMobile={isMobile}
            handleEditableChange={handleEditableChange}
            validatePlaceholders={validatePlaceholders}
          />
          
          {/* AI生成内容提示语 - PC端 */}
          <div className="ai-generated-disclaimer">
            {t('common.aiGeneratedDisclaimer')}
          </div>
        </div>
      )}
    </div>
  );
};

// 导出主组件
export default ChatInterface;

// 导出子组件和工具函数
export {
  MessageBubble,
  StreamRenderer,
  StaticMessage,
  ChatInput,
  SuggestedQuestions,
  isMobileDevice,
  isAndroidDevice,
  isIOSDevice,
};
