import React, { useEffect } from 'react';
import VoiceInput from '../VoiceInput';
import FileAttachment from '../FileAttachment';
import { ExtendedFileInfo } from '../hooks/useFileUpload';
import { focusEditableDiv } from '../utils/domHelpers';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  userInput: string;
  setUserInput: (value: string) => void;
  attachments: ExtendedFileInfo[];
  isSubmitting: boolean;
  isUploading: boolean;
  isGenerating?: boolean; // 添加是否正在生成的状态
  handleSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleVoiceInput: (text: string) => void;
  handleAttachClick: () => void;
  handleRemoveFile: (fileId: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStopGeneration?: () => void; // 添加停止生成的处理函数
  getUploadProgressData?: (progress?: number) => { progress: number };
  agentId: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  editableDivRef?: React.RefObject<HTMLDivElement>; // 添加可编辑div的ref
  agentName?: string;
  className?: string;
  isMobile?: boolean; // 添加isMobile属性，设为可选
  questionPrefix?: string; // 添加问题前缀显示
  setQuestionPrefix?: (prefix: string) => void; // 添加设置问题前缀的函数
  setSelectedQuestionText?: (text: string) => void; // 添加设置选择问题文本的函数
  handleEditableChange?: () => void; // 添加可编辑div内容变化处理函数
  validatePlaceholders?: () => boolean; // 添加验证占位符的函数
  suggestedQuestions?: React.ReactNode; // 添加推荐问题组件
}

/**
 * 聊天输入框组件
 */
const ChatInput: React.FC<ChatInputProps> = ({
  userInput,
  setUserInput,
  attachments,
  isSubmitting,
  isUploading,
  isGenerating = false,
  handleSubmit,
  suggestedQuestions,
  handleInputChange,
  handleKeyDown,
  handleVoiceInput,
  handleAttachClick,
  handleRemoveFile,
  handleFileUpload,
  handleStopGeneration,
  getUploadProgressData,
  agentId,
  inputRef,
  fileInputRef,
  editableDivRef: externalEditableDivRef,
  agentName = '智能体',
  className = '',
  isMobile = false,
  questionPrefix,
  setQuestionPrefix,
  setSelectedQuestionText,
  handleEditableChange,
  validatePlaceholders = () => true,
}) => {
  // 创建可编辑div的ref（如果外部没有传入则使用内部ref）
  const internalEditableDivRef = React.useRef<HTMLDivElement>(null);
  const editableDivRef = externalEditableDivRef || internalEditableDivRef;


  const { t } = useTranslation()


  // 添加状态来跟踪可编辑div的内容（用于移动端发送按钮显示逻辑）
  const [editableContent, setEditableContent] = React.useState('');

  // 在组件挂载后，建立inputRef与editableDivRef的联系
  useEffect(() => {
    if (editableDivRef.current) {
      // 将可编辑div元素保存到inputRef中（强制类型转换）
      (inputRef as any).current = editableDivRef.current;
    }
  }, [editableDivRef.current, inputRef]);

  // 同步userInput到可编辑div的内容
  useEffect(() => {
    if (editableDivRef.current && userInput !== editableContent) {
      editableDivRef.current.textContent = userInput;
      setEditableContent(userInput);
    }
  }, [userInput, editableContent]);

  // 处理可编辑div内容变化的函数
  const handleEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.textContent || '';
    setEditableContent(content);

    // 调用外部传入的处理函数
    if (handleEditableChange) {
      handleEditableChange();
    }
  };

  // 判断是否有内容（移动端使用editableContent，PC端使用userInput）
  const hasContent = isMobile ? editableContent.trim().length > 0 : userInput.trim().length > 0;

  // 渲染上传进度条
  const renderUploadProgress = (progress?: number) => {
    const progressData = getUploadProgressData
      ? getUploadProgressData(progress)
      : { progress: progress || 0 };

    return (
      <div className="upload-progress-container">
        <div className="upload-progress-bar" style={{ width: `${progressData.progress}%` }}></div>
      </div>
    );
  };

  return (
    <div className={`chat-input-container ${className} ${isMobile ? 'mobile-input' : ''}`}>
      {/* 显示已上传的附件 */}
      {attachments.length > 0 && (
        <div className="attachment-wrapper-box">
          <div className="chat-attachments">
            {attachments.map((file) => (
              <div key={file.id} className="attachment-wrapper">
                <FileAttachment
                  file={{
                    ...file,
                    url: file.previewUrl || file.url,
                  }}
                  onRemove={() => handleRemoveFile(file.id)}
                />
                {file.isUploading && renderUploadProgress(file.uploadProgress)}
              </div>
            ))}
          </div>
        </div>
      )}
      {suggestedQuestions && (
        <div className="suggested-questions-container">{suggestedQuestions}</div>
      )}

      <form onSubmit={handleSubmit} className="chat-form">
        <div className="editable-input-wrapper">
          <div
            ref={editableDivRef}
            className="chat-editable-input"
            contentEditable={!isSubmitting && !isUploading && !isGenerating}
            onInput={handleEditableInput}
            onKeyDown={(e) => {
              // 处理回车键提交
              if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            data-placeholder={t('agent.serviceIntro')}
            suppressContentEditableWarning={true}
          />
        </div>

        <div className="chat-actions">
          <div className="chat-actions-left">
            {/* 语音输入按钮 */}
            <VoiceInput
              disabled={isSubmitting || isUploading || isGenerating || hasContent}
              onTranscription={handleVoiceInput}
              className="chat-voice"
              agentId={agentId}
            />
            {/* 附件上传按钮 - 客服智能体隐藏此按钮  有内容时也隐藏*/}
            {agentId !== 'customer-service' && !isGenerating && !hasContent && (
              <button
                type="button"
                className="chat-attach-button"
                onClick={handleAttachClick}
                disabled={isSubmitting || isUploading || isGenerating}
                title={t('chat.uploadAttachment')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            onChange={handleFileUpload}
            multiple
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            disabled={isSubmitting || isUploading || isGenerating}
          />

          {/* 发送/停止按钮 */}
          <div className="action-buttons">
            {isGenerating ? (
              // 正在生成时显示停止按钮
              <button
                type="button"
                className="chat-stop-button"
                onClick={handleStopGeneration}
                title={t('chat.stopGeneration')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6" y="6" width="12" height="12"></rect>
                </svg>
              </button>
            ) : (
              // 正常状态下显示发送按钮
              // 移动端：只有有内容时才显示发送按钮
              // PC端：保持原有逻辑
              (!isMobile || hasContent) && (
                <button
                  type="submit"
                  className="chat-send-button"
                  disabled={
                    !hasContent ||
                    (isMobile ? editableContent.includes('{') : userInput.includes('{')) ||
                    isSubmitting ||
                    isUploading ||
                    isGenerating ||
                    !validatePlaceholders()
                  }
                  title={t('chat.sendMessage')}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              )
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
