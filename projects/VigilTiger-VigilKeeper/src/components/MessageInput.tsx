import React, { useRef, useState } from 'react';
import { MessageInputProps } from '../types';

function MessageInput({
  value,
  onChange,
  attachments,
  onAttachmentsChange,
  onSend,
  onFileUpload,
  onFileRemove,
  isUploading = false,
  isSending = false,
  onStop,
}: MessageInputProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileUpload) {
      // 选择文件后立即上传
      for (const file of files) {
        setUploadingFiles((prev) => new Set(prev).add(file.name));
        try {
          await onFileUpload(file);
          // 上传成功后添加到附件列表
          onAttachmentsChange([...attachments, file]);
        } catch (error) {
          console.error('文件上传失败:', error);
          alert(`文件 ${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(file.name);
            return next;
          });
        }
      }
    } else if (files.length > 0) {
      // 如果没有上传函数，直接添加到附件列表
      onAttachmentsChange([...attachments, ...files]);
    }
    // 重置input，允许重复选择同一文件
    e.target.value = '';
  };

  const handleRemoveAttachment = (index: number): void => {
    const removedFile = attachments[index];
    // 通知父组件移除文件映射
    if (removedFile && onFileRemove) {
      onFileRemove(removedFile.name);
    }
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = (): void => {
    // 检查是否有文件正在上传
    if (uploadingFiles.size > 0) {
      alert('正在解析文件内容，请稍候...');
      return;
    }
    
    // 检查是否正在上传中
    if (isUploading) {
      alert('正在解析文件内容，请稍候...');
      return;
    }
    
    if (value.trim() || attachments.length > 0) {
      onSend(value, attachments);
    }
  };

  return (
    <div className="message-input-container">
      {(attachments.length > 0 || uploadingFiles.size > 0) && (
        <div className="attachments-preview">
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="attachment-item">
              <span className="attachment-name">{file.name}</span>
              <button
                className="attachment-remove"
                onClick={() => handleRemoveAttachment(index)}
                type="button"
                aria-label={`移除附件 ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
          {Array.from(uploadingFiles).map((fileName) => (
            <div key={`uploading-${fileName}`} className="attachment-item uploading">
              <span className="attachment-name">{fileName}</span>
              <span className="upload-status">上传中...</span>
            </div>
          ))}
        </div>
      )}
      <div className="message-input-wrapper">
        <button
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          title="添加附件"
          type="button"
          aria-label="添加附件"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <textarea
          className="message-input"
          placeholder="发消息或输入/选择技能"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        {isSending ? (
          <button
            className="send-button stop-button"
            onClick={onStop}
            title="停止"
            type="button"
            aria-label="停止发送"
          >
            ⏹
          </button>
        ) : (
          <button
            className="send-button"
            onClick={handleSend}
            disabled={(!value.trim() && attachments.length === 0)}
            title="发送"
            type="button"
            aria-label="发送消息"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

export default MessageInput;


