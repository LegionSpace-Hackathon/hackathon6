import React, { useState } from 'react';
import { submitMessageFeedback } from '../../api/difyStream';

interface MessageActionsProps {
  content: string;
  isUser: boolean;
  messageId?: string;
  userId?: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * 消息操作按钮组件
 * 封装复制按钮和点赞/点踩功能
 */
const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  isUser,
  messageId = '',
  userId = '',
  isStreaming = false,
  className = ''
}) => {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // 复制消息内容到剪贴板
  const handleCopy = () => {
    // 尝试使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(content).then(
        () => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        },
        () => {
          // 如果 Clipboard API 失败，尝试使用 document.execCommand 方法
          fallbackCopyTextToClipboard();
        }
      );
    } else {
      // 对于不支持 Clipboard API 的设备，直接使用后备方法
      fallbackCopyTextToClipboard();
    }
  };

  // 后备复制方法，使用临时文本区域和 document.execCommand
  const fallbackCopyTextToClipboard = () => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = content;
      
      // 设置样式以使元素不可见
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      
      // 在移动设备上，尝试选择文本
      textArea.focus();
      textArea.select();
      
      // 对于iOS设备的特殊处理
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, content.length); // 适用于iOS
      }
      
      const successful = document.execCommand('copy');
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        console.error('复制失败');
      }
      
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('无法复制文本: ', err);
    }
  };

  // 提交反馈（点赞/点踩）
  const handleFeedback = async (rating: 'like' | 'dislike' | null) => {
    // 如果点击当前已选中的反馈类型，则取消选中
    const newRating = rating === feedback ? null : rating;
    setFeedback(newRating);
     console.log(messageId, newRating, userId, JSON.stringify(content));
    try {
      // 调用反馈API
      if (messageId && userId) {
        await submitMessageFeedback(messageId, newRating, userId, JSON.stringify(content));
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };

  return (
    <div className={`message-actions ${className} ${isStreaming && 'is-streaming'}`} >
      {/* 复制按钮 */}
      <button 
        className={`action-button copy-button ${isCopied ? 'copied' : ''}`} 
        onClick={handleCopy}
        title="复制消息内容"
      >
        {isCopied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </>
        )}
      </button>
      
      {/* 仅对AI消息显示点赞/点踩按钮 */}
      {!isUser && messageId && false && (
        <div className="feedback-buttons">
          {/* 点赞按钮 */}
          <button 
            className={`action-button like-button ${feedback === 'like' ? 'active' : ''}`}
            onClick={() => handleFeedback('like')}
            title="有帮助"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={feedback === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
          
          {/* 点踩按钮 */}
          <button 
            className={`action-button dislike-button ${feedback === 'dislike' ? 'active' : ''}`}
            onClick={() => handleFeedback('dislike')}
            title="没帮助"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={feedback === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageActions; 