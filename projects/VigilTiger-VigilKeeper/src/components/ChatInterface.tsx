import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import Sidebar, { Conversation } from './Sidebar';
import { getGreeting } from '../utils/greeting';
import { Message, UploadedFile } from '../types';
import { uploadFile, sendChatMessageStreamPost, removeToken, SSEEventData, BASE_URL } from '../services/api';
import { HistoryFile } from '../types';

function ChatInterface(): JSX.Element {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileMap, setFileMap] = useState<Map<string, UploadedFile>>(new Map()); // 文件名到上传文件信息的映射
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [displayedGreeting, setDisplayedGreeting] = useState<string>('');
  const [showCursor, setShowCursor] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // 侧边栏默认打开
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantMessageRef = useRef<Message | null>(null);

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  // 加载历史会话（按用户区分）
  useEffect(() => {
    const loadConversations = (): void => {
      const phoneNumber = localStorage.getItem('phoneNumber');
      if (phoneNumber) {
        const storageKey = `conversations_${phoneNumber}`;
        const savedConversations = localStorage.getItem(storageKey);
        if (savedConversations) {
          try {
            const parsed = JSON.parse(savedConversations) as Conversation[];
            setConversations(parsed);
          } catch (error) {
            console.error('加载历史会话失败:', error);
          }
        } else {
          // 如果没有保存的会话，初始化为空数组
          setConversations([]);
        }
      } else {
        setConversations([]);
      }
    };

    // 初始加载
    loadConversations();

    // 监听登录状态变化（当用户切换时重新加载）
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'phoneNumber') {
        loadConversations();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 保存历史会话到 localStorage（按用户区分）
  const saveConversations = (convs: Conversation[]): void => {
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) return;
    
    const storageKey = `conversations_${phoneNumber}`;
    localStorage.setItem(storageKey, JSON.stringify(convs));
    setConversations(convs);
  };

  // 新建会话
  const handleNewConversation = (): void => {
    setMessages([]);
    setCurrentConversationId('');
    setInputValue('');
    setAttachments([]);
    setUploadedFiles([]);
    setFileMap(new Map());
  };

  // 删除会话
  const handleDeleteConversation = (id: string): void => {
    // 如果删除的是当前会话，清空消息
    if (id === currentConversationId) {
      setMessages([]);
      setCurrentConversationId('');
      setInputValue('');
      setAttachments([]);
      setUploadedFiles([]);
      setFileMap(new Map());
    }

    // 从会话列表中删除
    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.filter((c) => c.id !== id);
      
      // 保存到 localStorage
      const phoneNumber = localStorage.getItem('phoneNumber');
      if (phoneNumber) {
        const storageKey = `conversations_${phoneNumber}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedConversations));
      }
      
      return updatedConversations;
    });
  };

  // 删除历史文件
  const handleDeleteHistoryFile = (fileId: string): void => {
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) return;

    const storageKey = `historyFiles_${phoneNumber}`;
    const savedFiles = localStorage.getItem(storageKey);
    
    if (savedFiles) {
      try {
        const historyFiles = JSON.parse(savedFiles) as HistoryFile[];
        const updatedFiles = historyFiles.filter((f) => f.id !== fileId);
        localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
        
        // 触发自定义事件，通知 Sidebar 刷新历史文件列表
        window.dispatchEvent(new CustomEvent('historyFileUpdated'));
      } catch (error) {
        console.error('删除历史文件失败:', error);
      }
    }
  };

  // 序列化消息数据（将 Date 对象转换为时间戳，File 对象转换为简单对象）
  const serializeMessages = (messages: Message[]): Conversation['messages'] => {
    return messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      displayText: msg.displayText,
      files: msg.files?.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      uploadedFiles: msg.uploadedFiles?.map((uf) => ({
        id: uf.id,
        name: uf.name,
        size: uf.size,
        extension: uf.extension,
        mimeType: uf.mimeType,
        createdBy: uf.createdBy,
        createdAt: uf.createdAt,
      })),
      timestamp: msg.timestamp.getTime(),
      type: msg.type,
      isStreaming: false, // 保存时不应该有流式状态
      status: msg.status === 'completed' ? 'completed' : 'completed', // 只保存已完成的消息
      retryData: msg.retryData ? {
        msg: msg.retryData.msg,
        fileId: msg.retryData.fileId,
        extension: msg.retryData.extension,
        files: msg.retryData.files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      } : undefined,
    }));
  };

  // 反序列化消息数据（将时间戳转换为 Date 对象，简单对象转换为 File 对象）
  const deserializeMessages = (serializedMessages: Conversation['messages']): Message[] => {
    if (!serializedMessages) return [];
    
    return serializedMessages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      displayText: msg.displayText,
      files: msg.files?.map((f) => {
        // 从序列化数据重建 File 对象（虚拟文件，仅用于显示）
        const blob = new Blob([], { type: f.type });
        return new File([blob], f.name, { type: f.type });
      }),
      uploadedFiles: msg.uploadedFiles?.map((uf) => ({
        id: uf.id,
        name: uf.name,
        size: uf.size,
        extension: uf.extension,
        mimeType: uf.mimeType,
        createdBy: uf.createdBy,
        createdAt: uf.createdAt,
      })),
      timestamp: new Date(msg.timestamp),
      type: msg.type,
      isStreaming: false, // 历史消息不应该是流式状态
      status: 'completed' as const, // 历史消息都是已完成状态
      retryData: msg.retryData ? {
        msg: msg.retryData.msg,
        fileId: msg.retryData.fileId,
        extension: msg.retryData.extension,
        files: msg.retryData.files.map((f) => {
          const blob = new Blob([], { type: f.type });
          return new File([blob], f.name, { type: f.type });
        }),
      } : undefined,
    }));
  };

  // 选择会话
  const handleSelectConversation = (id: string): void => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    currentAssistantMessageRef.current = null;

    // 从会话列表中查找对应的会话
    const selectedConversation = conversations.find((c) => c.id === id);
    if (selectedConversation && selectedConversation.messages) {
      // 反序列化消息数据
      const loadedMessages = deserializeMessages(selectedConversation.messages);
      setMessages(loadedMessages);
      setCurrentConversationId(id);
      
      // 清空输入框和附件
      setInputValue('');
      setAttachments([]);
      setUploadedFiles([]);
      setFileMap(new Map());
    } else {
      // 如果没有找到会话或没有消息，清空消息列表
      setMessages([]);
      setCurrentConversationId(id);
      setInputValue('');
      setAttachments([]);
      setUploadedFiles([]);
      setFileMap(new Map());
    }
  };

  // 更新或创建会话记录（保存消息数据）
  const updateConversation = (conversationId: string, title: string, lastMessage: string, currentMessages?: Message[]): void => {
    // 使用函数式更新确保获取最新的会话列表和消息列表
    setConversations((prevConversations) => {
      const updatedConversations = [...prevConversations];
      const existingIndex = updatedConversations.findIndex((c) => c.id === conversationId);
      
      // 使用传入的消息列表，如果没有则使用当前状态的消息列表
      const messagesToSave = currentMessages || messages;
      // 序列化当前消息列表（只保存已完成的消息）
      const completedMessages = messagesToSave.filter((msg) => msg.status === 'completed' || !msg.status);
      const serializedMessages = serializeMessages(completedMessages);
      
      const conversation: Conversation = {
        id: conversationId,
        title,
        lastMessage,
        timestamp: Date.now(),
        messages: serializedMessages, // 保存消息数据
      };

      if (existingIndex >= 0) {
        updatedConversations[existingIndex] = conversation;
      } else {
        updatedConversations.unshift(conversation);
      }

      // 限制最多保存50个会话
      if (updatedConversations.length > 50) {
        updatedConversations.pop();
      }

      // 保存到 localStorage
      const phoneNumber = localStorage.getItem('phoneNumber');
      if (phoneNumber) {
        const storageKey = `conversations_${phoneNumber}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedConversations));
      }

      return updatedConversations;
    });
  };

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 字符流显示问候语
  useEffect(() => {
    const phoneNumber = localStorage.getItem('phoneNumber') || '';
    const fullGreeting = getGreeting(phoneNumber);
    let currentIndex = 0;
    
    // 清除之前的定时器
    if (greetingTimeoutRef.current) {
      clearTimeout(greetingTimeoutRef.current);
    }

    const typeGreeting = (): void => {
      if (currentIndex < fullGreeting.length) {
        setDisplayedGreeting(fullGreeting.substring(0, currentIndex + 1));
        currentIndex++;
        greetingTimeoutRef.current = setTimeout(typeGreeting, 100); // 每个字符间隔100ms
      } else {
        // 打字完成后，延迟隐藏光标
        setTimeout(() => {
          setShowCursor(false);
        }, 500);
      }
    };

    // 开始打字效果
    typeGreeting();

    // 清理函数
    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, []); // 只在组件挂载时执行一次

  // 保存历史文件到 localStorage（按用户区分）
  const saveHistoryFile = (uploadedFile: UploadedFile, originalFileName?: string): void => {
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) return;

    const storageKey = `historyFiles_${phoneNumber}`;
    const existingFiles = localStorage.getItem(storageKey);
    let historyFiles: Array<{ id: string; name: string; originalName?: string; serverName?: string; size: number; extension: string; mimeType: string; createdBy: string; createdAt: number; uploadTimestamp: number }> = [];

    if (existingFiles) {
      try {
        historyFiles = JSON.parse(existingFiles);
      } catch (error) {
        console.error('解析历史文件失败:', error);
      }
    }

    // 检查是否已存在相同 id 的文件，如果存在则更新，否则添加
    const existingIndex = historyFiles.findIndex((f) => f.id === uploadedFile.id);
    // 使用原始文件名（用户选择的文件名）作为显示名称，如果没有则使用服务器返回的名称
    // 保存完整的数据，不进行过滤
    const displayName = originalFileName || uploadedFile.name;
    
    const historyFile = {
      id: uploadedFile.id,
      name: displayName, // 保存完整的文件名（包含时间戳等）
      originalName: originalFileName, // 原始文件名
      serverName: uploadedFile.name, // 服务器返回的文件名
      size: uploadedFile.size,
      extension: uploadedFile.extension,
      mimeType: uploadedFile.mimeType,
      createdBy: uploadedFile.createdBy,
      createdAt: uploadedFile.createdAt,
      uploadTimestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      historyFiles[existingIndex] = historyFile;
    } else {
      historyFiles.unshift(historyFile);
    }

    // 限制最多保存100个文件
    if (historyFiles.length > 100) {
      historyFiles = historyFiles.slice(0, 100);
    }

    localStorage.setItem(storageKey, JSON.stringify(historyFiles));
  };

  // 处理文件上传
  const handleFileUpload = async (file: File): Promise<UploadedFile> => {
    setIsUploading(true);
    try {
      // 调用上传接口
      const uploadedFileResponse = await uploadFile(file);
      
      // 保存完整的文件信息（包含返回的 data 实体数据）
      const fileWithOriginal: UploadedFile = {
        id: uploadedFileResponse.id, // fileId 对应返回数据中的 id
        name: uploadedFileResponse.name,
        size: uploadedFileResponse.size,
        extension: uploadedFileResponse.extension,
        mimeType: uploadedFileResponse.mimeType,
        createdBy: uploadedFileResponse.createdBy,
        createdAt: uploadedFileResponse.createdAt,
        file, // 保留原始文件对象用于显示
      };
      
      // 保存到上传文件列表
      setUploadedFiles((prev) => [...prev, fileWithOriginal]);
      
      // 建立文件名到上传文件信息的映射
      setFileMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(file.name, fileWithOriginal);
        return newMap;
      });

      // 保存到历史文件（按用户区分），使用原始文件名
      saveHistoryFile(fileWithOriginal, file.name);
      
      // 触发自定义事件，通知 Sidebar 刷新历史文件列表
      window.dispatchEvent(new CustomEvent('historyFileUpdated'));
      
      return fileWithOriginal;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // 处理发送消息
  const handleSendMessage = async (text: string, files: File[]): Promise<void> => {
    if (!text.trim() && files.length === 0) return;
    if (isSending) return; // 防止重复发送
    
    // 检查是否有文件正在上传
    if (isUploading) {
      alert('正在解析文件内容，请稍候...');
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建用户消息ID（在try外部定义，以便在catch中使用）
    const userMessageId = Date.now();

    try {
      setIsSending(true);

      // 如果有文件，使用已上传的文件信息
      let fileId: string | undefined;
      let extension: string | undefined;
      const currentUploadedFiles: UploadedFile[] = [];

      if (files.length > 0) {
        // 从文件映射中查找对应的已上传文件信息
        // 优先使用第一个文件的信息
        const firstFile = files[0];
        const uploadedFile = fileMap.get(firstFile.name);
        
        if (uploadedFile) {
          // 使用上传接口返回的 data 中的 id 作为 fileId
          fileId = uploadedFile.id;
          // 使用上传接口返回的 data 中的 extension
          extension = uploadedFile.extension;
          currentUploadedFiles.push(uploadedFile);
        } else {
          // 如果没有找到上传信息，尝试从 uploadedFiles 中查找
          const foundFile = uploadedFiles.find((uf) => uf.file?.name === firstFile.name);
          if (foundFile) {
            fileId = foundFile.id;
            extension = foundFile.extension;
            currentUploadedFiles.push(foundFile);
          }
        }
      }

      // 创建用户消息
      const userMessage: Message = {
        id: userMessageId,
        text: text.trim(),
        files: files,
        uploadedFiles: currentUploadedFiles.length > 0 ? currentUploadedFiles : undefined,
        timestamp: new Date(),
        type: 'user',
        // 保存请求数据，用于重新发送
        retryData: {
          msg: text.trim(),
          fileId,
          extension,
          files,
        },
      };

      // 如果没有当前会话ID，创建新会话
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = `conv_${Date.now()}`;
        setCurrentConversationId(conversationId);
      }

      // 更新消息列表
      setMessages((prev) => {
        const updatedMessages = [...prev, userMessage];
        
        // 创建或更新会话记录（使用用户消息的前30个字符作为标题）
        const conversationTitle = text.trim().substring(0, 30) || '新会话';
        updateConversation(conversationId, conversationTitle, text.trim(), updatedMessages);
        
        return updatedMessages;
      });
      
      setInputValue('');
      setAttachments([]);
      setUploadedFiles([]);
      setFileMap(new Map()); // 清空文件映射

      // 创建AI消息占位符
      const assistantMessageId = Date.now() + 1;
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: '',
        displayText: 'VigilKeeper思考中...',
        timestamp: new Date(),
        type: 'assistant',
        isStreaming: true,
        status: 'pending',
      };
      currentAssistantMessageRef.current = assistantMessage;
      setMessages((prev) => [...prev, assistantMessage]);

      // 使用SSE流式接收响应
      abortControllerRef.current = sendChatMessageStreamPost(
        {
          msg: text.trim(),
          fileId,
          extension,
        },
        (event: SSEEventData) => {
          // 处理不同类型的事件
          handleSSEEvent(event, assistantMessageId);
        },
        (error: Error) => {
          console.error('SSE错误:', error);
          setIsSending(false);
          // 删除AI消息占位符
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
          // 更新用户消息显示错误状态
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessageId
                ? {
                    ...msg,
                    status: 'error',
                  }
                : msg
            )
          );
        },
        () => {
          setIsSending(false);
          abortControllerRef.current = null;
          currentAssistantMessageRef.current = null;
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setIsSending(false);
      // 更新用户消息显示错误状态
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? {
                ...msg,
                status: 'error',
              }
            : msg
        )
      );
    }
  };

  // 处理SSE事件
  const handleSSEEvent = (event: SSEEventData, messageId: number): void => {
    // 根据事件类型处理不同的数据
    switch (event.event) {
      case 'workflow_started':
        // 工作流开始，更新状态为streaming，保持占位符文本
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: 'streaming', displayText: msg.displayText || 'VigilKeeper思考中...' }
              : msg
          )
        );
        break;

      case 'node_started':
      case 'node_finished':
        // 节点开始和完成事件，不处理内容，只作为思考过程
        // 这些事件不显示内容
        break;

      case 'workflow_finished':
        // 工作流完成，从 data.outputs.answer 提取最终结果，一次性替换之前的内容
        if (event.data && typeof event.data === 'object') {
          const workflowData = event.data as {
            outputs?: { answer?: string; [key: string]: unknown };
            [key: string]: unknown;
          };
          
          // 提取最终答案
          let finalAnswer = workflowData.outputs?.answer;
          
          if (finalAnswer && typeof finalAnswer === 'string') {
            // 处理附件链接：将 /files 开头的链接转换为完整下载链接
            // 匹配格式：[文件名](/files/...)
            finalAnswer = finalAnswer.replace(
              /\[([^\]]+)\]\(\/files\/([^\)]+)\)/g,
              (match, filename, filePath) => {
                // 构建完整下载链接
                const downloadUrl = `${BASE_URL}/ai/downloadFile?fileUrl=/files/${filePath}`;
                return `[${filename}](${downloadUrl})`;
              }
            );
            
            // 处理换行符：单个\n保留，多个\n减少一个
            // 1个\n → 1个\n（保留），2个\n → 1个\n，3个\n → 2个\n，以此类推
            finalAnswer = finalAnswer.replace(/\n{2,}/g, (match) => {
              const count = match.length;
              // 多个换行符减少一个
              return '\n'.repeat(count - 1);
            });
            
            // 一次性替换之前流式渲染的内容
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      status: 'completed' as const,
                      isStreaming: false,
                      displayText: finalAnswer,
                      text: finalAnswer,
                    }
                  : msg
              );

              // 更新会话的最后一条消息（使用更新后的消息列表）
              if (currentConversationId && finalAnswer) {
                const lastUserMessage = updated.find((m) => m.type === 'user');
                const conversationTitle = lastUserMessage?.text?.substring(0, 30) || '新会话';
                updateConversation(currentConversationId, conversationTitle, finalAnswer.substring(0, 50), updated);
              }

              return updated;
            });
          } else {
            // 如果没有 answer，标记为完成，保留现有内容
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      status: 'completed',
                      isStreaming: false,
                      text: msg.displayText || msg.text || '',
                    }
                  : msg
              )
            );
          }
        } else {
          // 没有数据，直接标记为完成
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    status: 'completed',
                    isStreaming: false,
                    text: msg.displayText || msg.text || '',
                  }
                : msg
            )
          );
        }
        break;

      case 'message':
        // message 事件：从 answer 字段提取内容进行流式渲染
        // 事件结构：{"event":"message",...,"answer":"根据",...}
        const answerValue = event.answer;
        if (answerValue && typeof answerValue === 'string') {
          // 如果是第一次收到 message 事件，清空占位符文本
          setMessages((prev) => {
            const currentMsg = prev.find((msg) => msg.id === messageId);
            if (currentMsg && (currentMsg.displayText === 'VigilKeeper思考中...' || currentMsg.displayText === '')) {
              return prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, displayText: '', text: '' }
                  : msg
              );
            }
            return prev;
          });
          
          // 处理换行符：单个\n保留，多个\n减少一个
          // 1个\n → 1个\n（保留），2个\n → 1个\n，3个\n → 2个\n，以此类推
          const processedAnswer = answerValue.replace(/\n{2,}/g, (match) => {
            const count = match.length;
            // 多个换行符减少一个
            return '\n'.repeat(count - 1);
          });
          
          // 流式追加文本
          streamTextToMessage(messageId, processedAnswer);
        }
        break;

      default:
        console.log('未知事件类型:', event.event, event);
    }
  };

  // 流式文本渲染（直接追加文本，由CSS动画实现视觉效果）
  const streamTextToMessage = (messageId: number, newText: string): void => {
    setMessages((prev) => {
      const currentMsg = prev.find((msg) => msg.id === messageId);
      if (!currentMsg) return prev;

      const currentText = currentMsg.displayText || currentMsg.text || '';
      const fullText = currentText + newText;

      return prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              displayText: fullText,
              text: fullText,
              status: 'streaming',
              isStreaming: true,
            }
          : msg
      );
    });
  };

  // 重新发送失败的消息
  const handleRetryMessage = async (messageId: number): Promise<void> => {
    const failedMessage = messages.find((msg) => msg.id === messageId);
    if (!failedMessage || !failedMessage.retryData) {
      return;
    }

    const { msg, fileId, extension, files } = failedMessage.retryData;

    // 如果有文件，需要重新上传
    let finalFileId = fileId;
    let finalExtension = extension;
    const currentUploadedFiles: UploadedFile[] = [];

    if (files.length > 0) {
      try {
        // 重新上传文件
        for (const file of files) {
          const uploadedFile = await handleFileUpload(file);
          currentUploadedFiles.push(uploadedFile);
        }
        // 使用第一个文件的信息
        if (currentUploadedFiles.length > 0) {
          finalFileId = currentUploadedFiles[0].id;
          finalExtension = currentUploadedFiles[0].extension;
        }
      } catch (error) {
        console.error('重新上传文件失败:', error);
        alert('重新上传文件失败，请重试');
        return;
      }
    }

    // 删除失败的消息
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    // 重新发送消息
    try {
      setIsSending(true);

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建用户消息
      const userMessage: Message = {
        id: Date.now(),
        text: msg,
        files: files,
        uploadedFiles: currentUploadedFiles.length > 0 ? currentUploadedFiles : undefined,
        timestamp: new Date(),
        type: 'user',
      };

      setMessages((prev) => [...prev, userMessage]);

      // 创建AI消息占位符
      const assistantMessageId = Date.now() + 1;
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: '',
        displayText: '',
        timestamp: new Date(),
        type: 'assistant',
        isStreaming: true,
        status: 'pending',
        retryData: {
          msg,
          fileId: finalFileId,
          extension: finalExtension,
          files,
        },
      };
      currentAssistantMessageRef.current = assistantMessage;
      setMessages((prev) => [...prev, assistantMessage]);

      // 使用SSE流式接收响应
      abortControllerRef.current = sendChatMessageStreamPost(
        {
          msg,
          fileId: finalFileId,
          extension: finalExtension,
        },
        (event: SSEEventData) => {
          handleSSEEvent(event, assistantMessageId);
        },
        (error: Error) => {
          console.error('SSE错误:', error);
          setIsSending(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    text: `错误: ${error.message}`,
                    displayText: `错误: ${error.message}`,
                    status: 'error',
                    isStreaming: false,
                  }
                : msg
            )
          );
        },
        () => {
          setIsSending(false);
          abortControllerRef.current = null;
          currentAssistantMessageRef.current = null;
        }
      );
    } catch (error) {
      console.error('重新发送消息失败:', error);
      setIsSending(false);
      alert(error instanceof Error ? error.message : '重新发送消息失败，请重试');
    }
  };

  // 停止发送消息
  const handleStop = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    
    // 更新AI消息状态：如果有已渲染的内容，保留它；如果没有内容，删除占位符
    if (currentAssistantMessageRef.current) {
      const assistantMessageId = currentAssistantMessageRef.current.id;
      setMessages((prev) => {
        const currentMsg = prev.find((msg) => msg.id === assistantMessageId);
        if (!currentMsg) return prev;
        
        // 检查是否有实际内容（不是占位符且不为空）
        const hasContent = currentMsg.displayText && 
          currentMsg.displayText !== 'VigilKeeper思考中...' && 
          currentMsg.displayText.trim() !== '';
        
        if (hasContent) {
          // 有内容：保留消息，停止流式渲染，标记为已完成
          return prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  status: 'completed',
                  isStreaming: false,
                  text: msg.displayText || msg.text || '',
                }
              : msg
          );
        } else {
          // 没有内容：删除占位符消息
          return prev.filter((msg) => msg.id !== assistantMessageId);
        }
      });
      currentAssistantMessageRef.current = null;
    }
  };

  const handleLogout = (): void => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // 在退出登录前，保存当前手机号作为上一次登录的手机号
    const currentPhoneNumber = localStorage.getItem('phoneNumber');
    if (currentPhoneNumber) {
      localStorage.setItem('lastPhoneNumber', currentPhoneNumber);
    }
    // 清除登录状态
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('phoneNumber');
    removeToken();
    navigate('/login');
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const phoneNumber = localStorage.getItem('phoneNumber') || '';

  return (
    <div className="chat-layout">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectHistoryFile={(historyFile: HistoryFile) => {
            // 点击历史文件时，替换聊天区的附件
            // 创建一个虚拟的 File 对象用于显示（实际发送时使用历史文件的信息）
            const virtualFile = new File([new Blob()], historyFile.name, { 
              type: historyFile.mimeType,
              lastModified: historyFile.createdAt * 1000,
            });
            
            // 替换聊天区的附件
            setAttachments([virtualFile]);
            
            // 更新文件映射，使用历史文件信息
            const uploadedFile: UploadedFile = {
              id: historyFile.id,
              name: historyFile.name,
              size: historyFile.size,
              extension: historyFile.extension,
              mimeType: historyFile.mimeType,
              createdBy: historyFile.createdBy,
              createdAt: historyFile.createdAt,
              file: virtualFile,
            };
            setFileMap(new Map([[historyFile.name, uploadedFile]]));
            setUploadedFiles([uploadedFile]);
          }}
          onDeleteHistoryFile={handleDeleteHistoryFile}
        />
      <div className="chat-interface">
        {messages.length > 0 && (
          <div className="chat-header">
            <button
              type="button"
              className="sidebar-toggle-button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
              aria-label={isSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            >
              {isSidebarOpen ? '◀' : '▶'}
            </button>
            <h1 className="greeting">
              {displayedGreeting}
              {showCursor && <span className="cursor">|</span>}
            </h1>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="chat-center-container">
            <div className="chat-welcome">
              <div className="chat-welcome-icon">🤖</div>
              <div className="chat-welcome-text" style={{ fontSize: '28px', fontWeight: 'bold' }}>VigilKeeper</div>
              <div className="chat-welcome-text">协助跟踪和处理合同重要事项。</div>
            </div>
            <div className="chat-center-input">
              {/* 快捷消息按钮 */}
              <div className="quick-messages-center">
                <button
                  type="button"
                  className="quick-message-button-center"
                  onClick={() => handleSendMessage('草拟催款函', [])}
                  disabled={isSending || isUploading}
                  title="草拟催款函"
                >
                  <span className="quick-message-icon">📝</span>
                  <span className="quick-message-text">草拟催款函</span>
                </button>
                <button
                  type="button"
                  className="quick-message-button-center"
                  onClick={() => handleSendMessage('跟踪合同进度', [])}
                  disabled={isSending || isUploading}
                  title="跟踪合同进度"
                >
                  <span className="quick-message-icon">📊</span>
                  <span className="quick-message-text">跟踪合同进度</span>
                </button>
              </div>
              <MessageInput
                value={inputValue}
                onChange={setInputValue}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                onSend={handleSendMessage}
                onFileUpload={handleFileUpload}
                onFileRemove={(fileName: string) => {
                  setFileMap((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(fileName);
                    return newMap;
                  });
                }}
                isUploading={isUploading}
                isSending={isSending}
                onStop={handleStop}
              />
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} messagesEndRef={messagesEndRef} onRetry={handleRetryMessage} />
            <div className="chat-footer">
              {/* 快捷消息按钮 */}
              <div className="quick-messages">
                <button
                  type="button"
                  className="quick-message-button"
                  onClick={() => handleSendMessage('草拟催款函', [])}
                  disabled={isSending || isUploading}
                  title="草拟催款函"
                >
                  草拟催款函
                </button>
                <button
                  type="button"
                  className="quick-message-button"
                  onClick={() => handleSendMessage('跟踪合同进度', [])}
                  disabled={isSending || isUploading}
                  title="跟踪合同进度"
                >
                  跟踪合同进度
                </button>
              </div>
              <MessageInput
                value={inputValue}
                onChange={setInputValue}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                onSend={handleSendMessage}
                onFileUpload={handleFileUpload}
                onFileRemove={(fileName: string) => {
                  setFileMap((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(fileName);
                    return newMap;
                  });
                }}
                isUploading={isUploading}
                isSending={isSending}
                onStop={handleStop}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;


