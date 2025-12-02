import React from 'react';
import { MessageListProps } from '../types';
import './MessageList.css';

// 使用 require 方式导入（Web 兼容）
// @ts-ignore
const ReactMarkdown = require('react-markdown').default;
// @ts-ignore
const remarkGfm = require('remark-gfm').default;

function MessageList({ messages, messagesEndRef, onRetry }: MessageListProps): JSX.Element {
  const formatTime = (timestamp: Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <p>开始对话吧！</p>
        </div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.files && message.files.length > 0 && (
                <div className="message-files">
                  {message.files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="file-item">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {message.displayText || message.text ? (
                <div className="message-text">
                  <ReactMarkdown
                    remarkPlugins={remarkGfm ? [remarkGfm] : undefined}
                    components={{
                      // 自定义样式组件
                      p: ({ ...props }) => <p className="markdown-p" {...props} />,
                      h1: ({ ...props }) => <h1 className="markdown-h1" {...props} />,
                      h2: ({ ...props }) => <h2 className="markdown-h2" {...props} />,
                      h3: ({ ...props }) => <h3 className="markdown-h3" {...props} />,
                      ul: ({ ...props }) => <ul className="markdown-ul" {...props} />,
                      ol: ({ ...props }) => <ol className="markdown-ol" {...props} />,
                      li: ({ ...props }) => <li className="markdown-li" {...props} />,
                      code: ({ inline, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string }) =>
                        inline ? (
                          <code className="markdown-code-inline" {...(props as React.HTMLAttributes<HTMLElement>)} />
                        ) : (
                          <code className="markdown-code-block" {...(props as React.HTMLAttributes<HTMLElement>)} />
                        ),
                      pre: ({ ...props }) => <pre className="markdown-pre" {...props} />,
                      blockquote: ({ ...props }) => (
                        <blockquote className="markdown-blockquote" {...props} />
                      ),
                      a: ({ ...props }) => <a className="markdown-a" {...props} />,
                      table: ({ ...props }) => <table className="markdown-table" {...props} />,
                      thead: ({ ...props }) => <thead className="markdown-thead" {...props} />,
                      tbody: ({ ...props }) => <tbody className="markdown-tbody" {...props} />,
                      tr: ({ ...props }) => <tr className="markdown-tr" {...props} />,
                      th: ({ ...props }) => <th className="markdown-th" {...props} />,
                      td: ({ ...props }) => <td className="markdown-td" {...props} />,
                    }}
                  >
                    {message.displayText || message.text || ''}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="streaming-cursor">▋</span>
                  )}
                </div>
              ) : message.status === 'pending' ? (
                <p className="message-text">
                  <span className="loading-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </p>
              ) : null}
              {/* 错误状态和重新发送按钮只在用户消息中显示 */}
              {message.type === 'user' && message.status === 'error' && (
                <div className="message-error-container">
                  <p className="message-error">发送失败</p>
                  {onRetry && (
                    <button
                      type="button"
                      className="retry-button"
                      onClick={() => onRetry(message.id)}
                      aria-label="重新发送"
                      title="重新发送"
                    >
                      ↻
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;


