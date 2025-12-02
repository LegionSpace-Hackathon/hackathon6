import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FileInfo } from '../components/Chat/FileAttachment';
import storageManager from '../../../utils/storageManager';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isHistorical?: boolean;
  files?: FileInfo[];
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

interface MessageContextType {
  messages: Message[];
  currentConversationId: string | null;
  conversations: Conversation[];
  setCurrentConversationId: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendToMessage: (id: string, content: string) => void;
  clearMessages: (conversationId?: string) => void;
  setStreamingStatus: (id: string, isStreaming: boolean) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
  initialConversationId?: string;
}

// 本地存储键
const STORAGE_KEYS = {
  MESSAGES: 'agent_messages',
  CONVERSATIONS: 'agent_conversations',
  CURRENT_CONVERSATION: 'agent_current_conversation'
};

export const MessageProvider: React.FC<MessageProviderProps> = ({ 
  children, 
  initialConversationId 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId || null);

  // 从本地存储恢复数据
  useEffect(() => {
    // 如果没有会话ID，表示是新会话，不加载历史消息
    if (!initialConversationId) {
      // 清空非历史消息，保留仅供显示的历史记录
      setMessages(prevMessages => prevMessages.filter(msg => msg.isHistorical));
      return;
    }

    const loadStorage = () => {
      // 恢复会话列表
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (savedConversations) {
        try {
          setConversations(JSON.parse(savedConversations));
        } catch (error) {
          console.error('无法解析存储的会话', error);
        }
      }
      
      // 恢复消息历史
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          const messagesWithHistoricalFlag = parsedMessages.map((msg: Message) => ({
            ...msg,
            isHistorical: true,
            isStreaming: false // 确保历史消息不处于流式状态
          }));
          setMessages(messagesWithHistoricalFlag);
        } catch (error) {
          console.error('无法解析存储的消息', error);
        }
      }
      
      // 恢复当前会话ID
      const savedCurrentConversation = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
      if (savedCurrentConversation && !initialConversationId) {
        setCurrentConversationId(savedCurrentConversation);
      }
    };
    
    loadStorage();
  }, [initialConversationId]);

  // 保存数据到本地存储
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // 清理消息数据，移除大文件内容以节省存储空间
        const cleanedMessages = messages.map(msg => ({
          ...msg,
          files: msg.files?.map(file => ({
            ...file,
            previewUrl: undefined // 移除base64预览数据
          }))
        }));
        
        const messageData = JSON.stringify(cleanedMessages);
        
        // 使用存储管理器安全地保存数据
        const success = storageManager.safeSetItem(STORAGE_KEYS.MESSAGES, messageData);
        
        if (!success) {
          console.warn('使用存储管理器保存失败，尝试压缩数据');
          // 只保留最近30条消息
          const recentMessages = cleanedMessages.slice(-30);
          storageManager.safeSetItem(STORAGE_KEYS.MESSAGES, JSON.stringify(recentMessages));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('localStorage配额超限，执行清理操作');
          try {
            // 清理旧数据，只保留最近20条消息
            const recentMessages = messages.slice(-20).map(msg => ({
              ...msg,
              files: msg.files?.map(file => ({
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url
                // 完全移除previewUrl等大数据字段
              }))
            }));
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(recentMessages));
          } catch (secondError) {
            console.error('无法保存消息到本地存储，清空存储:', secondError);
            localStorage.removeItem(STORAGE_KEYS.MESSAGES);
          }
        } else {
          console.error('保存消息失败:', error);
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    if (conversations.length > 0) {
      const conversationData = JSON.stringify(conversations);
      const success = storageManager.safeSetItem(STORAGE_KEYS.CONVERSATIONS, conversationData);
      
      if (!success) {
        console.warn('会话数据保存失败，压缩数据');
        // 只保留最近10个会话
        const recentConversations = conversations.slice(-10);
        storageManager.safeSetItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(recentConversations));
        setConversations(recentConversations);
      }
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (currentConversationId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, currentConversationId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
      }
    } catch (error) {
      console.error('保存当前会话ID失败:', error);
    }
  }, [currentConversationId]);

 

  // 更新会话信息
  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev =>
      prev.map(conv => (conv.id === id ? { ...conv, ...updates } : conv))
    );
  };

  // 删除会话
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // 如果删除的是当前会话，清空当前会话ID
    if (id === currentConversationId) {
      setCurrentConversationId(null);
    }
    
    // 删除该会话的所有消息
    setMessages(prev => prev.filter(msg => msg.conversationId !== id));
  };

  // 添加新消息
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    // if (!currentConversationId && !message.conversationId) {
    //   throw new Error('未指定会话ID');
    // }
    
    const convId = message.conversationId || currentConversationId as string;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newMessage = {
      ...message,
      id,
      conversationId: convId,
      timestamp: Date.now(),
      isHistorical: false, // 新添加的消息不是历史消息
    };

    setMessages(prev => [...prev, newMessage]);
    
    // 更新会话的最后消息和时间戳
    if (message.role === 'user') {
      updateConversation(convId, {
        lastMessage: message.content,
        timestamp: newMessage.timestamp
      });
    }
    
    return id;
  };

  // 更新消息
  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  // 向现有消息追加内容（用于流式响应）
  const appendToMessage = (id: string, content: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, content: msg.content + content } : msg
      )
    );
  };

  // 清空消息
  const clearMessages = (conversationId?: string) => {
    if (conversationId) {
      // 只清空指定会话的消息
      setMessages(prev => prev.filter(msg => msg.conversationId !== conversationId));
    } else {
      // 清空所有消息
      setMessages([]);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    }
  };

  // 设置消息的流式状态
  const setStreamingStatus = (id: string, isStreaming: boolean) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, isStreaming } : msg))
    );
  };

  const value = {
    messages: currentConversationId 
      ? messages.filter(msg => msg.conversationId === currentConversationId)
      : [],
    currentConversationId,
    conversations,
    setCurrentConversationId,
    addMessage,
    updateMessage,
    appendToMessage,
    clearMessages,
    setStreamingStatus,
    updateConversation,
    deleteConversation
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};