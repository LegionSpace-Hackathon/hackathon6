import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../services/api';
import { maskPhoneNumber } from '../utils/greeting';
import { HistoryFile } from '../types';
import './Sidebar.css';

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages?: Array<{
    id: number;
    text?: string;
    displayText?: string;
    files?: Array<{ name: string; size: number; type: string }>;
    uploadedFiles?: Array<{
      id: string;
      name: string;
      size: number;
      extension: string;
      mimeType: string;
      createdBy: string;
      createdAt: number;
    }>;
    timestamp: number;
    type: 'user' | 'assistant';
    isStreaming?: boolean;
    status?: 'pending' | 'streaming' | 'completed' | 'error';
    retryData?: {
      msg: string;
      fileId?: string;
      extension?: string;
      files: Array<{ name: string; size: number; type: string }>;
    };
  }>;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (id: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  onSelectHistoryFile?: (file: HistoryFile) => void;
  onDeleteHistoryFile?: (fileId: string) => void;
}

function Sidebar({ conversations, currentConversationId, onSelectConversation, onNewConversation, onDeleteConversation, isOpen = true, onToggle, onSelectHistoryFile, onDeleteHistoryFile }: SidebarProps): JSX.Element {
  const navigate = useNavigate();
  const phoneNumber = localStorage.getItem('phoneNumber') || '';
  const maskedPhoneNumber = maskPhoneNumber(phoneNumber);
  const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([]);
  const [isConversationsExpanded, setIsConversationsExpanded] = useState<boolean>(true);
  const [isFilesExpanded, setIsFilesExpanded] = useState<boolean>(true);

  // 加载历史文件（按用户区分）
  useEffect(() => {
    if (phoneNumber) {
      const storageKey = `historyFiles_${phoneNumber}`;
      const savedFiles = localStorage.getItem(storageKey);
      if (savedFiles) {
        try {
          const parsed = JSON.parse(savedFiles) as HistoryFile[];
          setHistoryFiles(parsed);
        } catch (error) {
          console.error('加载历史文件失败:', error);
        }
      }
    }
  }, [phoneNumber]);

  // 加载历史文件的函数
  const loadHistoryFiles = (): void => {
    if (phoneNumber) {
      const storageKey = `historyFiles_${phoneNumber}`;
      const savedFiles = localStorage.getItem(storageKey);
      if (savedFiles) {
        try {
          const parsed = JSON.parse(savedFiles) as HistoryFile[];
          setHistoryFiles(parsed);
        } catch (error) {
          console.error('加载历史文件失败:', error);
        }
      } else {
        setHistoryFiles([]);
      }
    }
  };

  // 监听自定义事件，当文件上传成功后刷新列表
  useEffect(() => {
    const handleFileUpdated = (): void => {
      loadHistoryFiles();
    };

    window.addEventListener('historyFileUpdated', handleFileUpdated);
    return () => {
      window.removeEventListener('historyFileUpdated', handleFileUpdated);
    };
  }, []);

  // 监听 localStorage 变化（当其他标签页保存文件时）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (phoneNumber && e.key === `historyFiles_${phoneNumber}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as HistoryFile[];
          setHistoryFiles(parsed);
        } catch (error) {
          console.error('更新历史文件失败:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [phoneNumber]);

  const handleLogout = (): void => {
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

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 过滤文件名中的时间戳（仅用于UI显示）
  const cleanFileNameForDisplay = (fileName: string): string => {
    // 匹配文件名中最后一个下划线后的纯数字时间戳
    // 例如: "文件名_1764381456737.docx" -> "文件名.docx"
    // 或者: "文件名_1764381456737" -> "文件名"
    return fileName.replace(/_\d+(\.[^.]+)?$/, (match, ext) => {
      // 如果匹配到扩展名，保留扩展名
      return ext || '';
    });
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">👤</div>
          <div className="sidebar-phone">{maskedPhoneNumber || '未登录'}</div>
        </div>
      </div>

      <div className="sidebar-content">
        <button
          type="button"
          className="sidebar-new-chat-button"
          onClick={onNewConversation}
          title="新建会话"
        >
          <span className="sidebar-new-icon">+</span>
          <span className="sidebar-new-text">新建会话</span>
        </button>

        <div className="sidebar-conversations">
          <div 
            className="sidebar-conversations-title"
            onClick={() => setIsConversationsExpanded(!isConversationsExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsConversationsExpanded(!isConversationsExpanded);
              }
            }}
          >
            <span>历史会话</span>
            <span className={`sidebar-expand-icon ${isConversationsExpanded ? 'expanded' : 'collapsed'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          {isConversationsExpanded && (
            <div className="sidebar-conversations-list">
              {conversations.length === 0 ? (
                <div className="sidebar-empty">暂无历史会话</div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`sidebar-conversation-item ${
                      currentConversationId === conversation.id ? 'active' : ''
                    }`}
                  >
                    <div
                      className="sidebar-conversation-content"
                      onClick={() => onSelectConversation?.(conversation.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectConversation?.(conversation.id);
                        }
                      }}
                    >
                      <div className="sidebar-conversation-title">{conversation.title}</div>
                      <div className="sidebar-conversation-preview">{conversation.lastMessage}</div>
                      <div className="sidebar-conversation-time">{formatTime(conversation.timestamp)}</div>
                    </div>
                    <button
                      type="button"
                      className="sidebar-delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('确定要删除这个会话吗？')) {
                          onDeleteConversation?.(conversation.id);
                        }
                      }}
                      title="删除会话"
                      aria-label="删除会话"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sidebar-files">
          <div 
            className="sidebar-files-title"
            onClick={() => setIsFilesExpanded(!isFilesExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsFilesExpanded(!isFilesExpanded);
              }
            }}
          >
            <div className="sidebar-files-title-left">
              <span className="sidebar-files-title-text">历史文件</span>
              <span 
                className="sidebar-files-hint" 
                title="点击文件可添加至聊天附件区"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡，避免触发展开/收起
                }}
              >
                💡
              </span>
            </div>
            <span className={`sidebar-expand-icon ${isFilesExpanded ? 'expanded' : 'collapsed'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          {isFilesExpanded && (
            <div className="sidebar-files-list">
              {historyFiles.length === 0 ? (
                <div className="sidebar-empty">暂无历史文件</div>
              ) : (
                historyFiles.map((file) => (
                  <div
                    key={file.id}
                    className="sidebar-file-item"
                  >
                    <div
                      className="sidebar-file-content"
                      onClick={() => onSelectHistoryFile?.(file)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectHistoryFile?.(file);
                        }
                      }}
                      title={`点击添加 ${cleanFileNameForDisplay(file.name)} 到聊天附件区`}
                    >
                      <div className="sidebar-file-icon">
                        {file.extension === '.pdf' ? '📄' : file.extension === '.doc' || file.extension === '.docx' ? '📝' : file.extension === '.xls' || file.extension === '.xlsx' ? '📊' : file.extension === '.jpg' || file.extension === '.png' || file.extension === '.jpeg' ? '🖼️' : '📎'}
                      </div>
                      <div className="sidebar-file-info">
                        <div className="sidebar-file-name">{cleanFileNameForDisplay(file.name)}</div>
                        <div className="sidebar-file-meta">
                          <span className="sidebar-file-size">{(file.size / 1024).toFixed(2)} KB</span>
                          <span className="sidebar-file-time">{formatTime(file.uploadTimestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sidebar-delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('确定要删除这个文件吗？')) {
                          onDeleteHistoryFile?.(file.id);
                        }
                      }}
                      title="删除文件"
                      aria-label="删除文件"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout-button"
          onClick={handleLogout}
          title="退出登录"
        >
          <span className="sidebar-logout-icon">🚪</span>
          <span className="sidebar-logout-text">退出登录</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

