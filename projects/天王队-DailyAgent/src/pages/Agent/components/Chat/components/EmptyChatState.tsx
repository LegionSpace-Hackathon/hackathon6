import React from "react";
import SuggestedQuestions, { PresetQuestion } from "./SuggestedQuestions";
import ChatInput from "./ChatInput";
import { ExtendedFileInfo } from "../hooks/useFileUpload";
import { useAppSelector } from "@/stores/hooks";
import { useTranslation } from "react-i18next";
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  BellOutlined,
  CodeOutlined,
  BgColorsOutlined,
  TranslationOutlined,
  FileImageOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';

interface InteractiveAgent {
  id: string;
  label: string;
  icon: React.ReactNode;
  text: string; // text to send/fill
  color: string;
}

interface VisualAgent {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface EmptyChatStateProps {
  agentName?: string;
  agentDescription?: string;
  agentAvatar?: string;
  suggestedQuestions: PresetQuestion[];
  onQuestionClick: (question: PresetQuestion) => void;
  selectedQuestionId?: string;
  disabled?: boolean;
  isReadOnly?: boolean; // 添加只读模式参数

  // ChatInput props
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
  editableDivRef?: React.RefObject<HTMLDivElement>;
  isMobile?: boolean;
  questionPrefix?: string;
  setQuestionPrefix?: (prefix: string) => void;
  handleEditableChange?: () => void;
  validatePlaceholders?: () => boolean;
}

/**
 * 空聊天状态组件
 */
const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  agentName = "智能体",
  agentDescription = "开始一个新的对话吧！",
  agentAvatar,
  suggestedQuestions,
  onQuestionClick,
  selectedQuestionId,
  disabled = false,
  isReadOnly = false,

  // ChatInput props
  userInput,
  setUserInput,
  attachments,
  isSubmitting,
  isUploading,
  isGenerating = false,
  handleSubmit,
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
  editableDivRef,
  isMobile,
  questionPrefix,
  setQuestionPrefix,
  handleEditableChange,
  validatePlaceholders,
}) => {
  // 从Redux获取认证状态和用户信息
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();

  const interactiveAgents: InteractiveAgent[] = [
    {
      id: 'progress_control',
      label: t('agent.productService'),
      icon: <ProjectOutlined />,
      text: t('agent.productServiceDesc'),
      color: '#3b82f6' // Blue
    },
    {
      id: 'weekly_summary',
      label: t('agent.typicalClient'),
      icon: <FileTextOutlined />,
      text: t('agent.typicalClientDesc'),
      color: '#10b981' // Emerald
    },
    {
      id: 'progress_reminder',
      label: t('agent.contactUs'),
      icon:  <VideoCameraOutlined />,
      text: t('agent.contactUsDesc'),
      color: '#f59e0b' // Amber
    }
  ];

  const visualAgents: VisualAgent[] = [
    {
      id: 'code_assistant',
      label: t('chat.visual.codeAssistant'),
      icon: <CodeOutlined />,
      color: '#6366f1' // Indigo
    },
    {
      id: 'ui_designer',
      label: t('chat.visual.uiDesigner'),
      icon: <BgColorsOutlined />,
      color: '#ec4899' // Pink
    },
    {
      id: 'translator',
      label: t('chat.visual.translator'),
      icon: <TranslationOutlined />,
      color: '#8b5cf6' // Violet
    },
    {
      id: 'image_gen',
      label: t('chat.visual.imageGen'),
      icon: <FileImageOutlined />,
      color: '#06b6d4' // Cyan
    },
    {
      id: 'video_gen',
      label: t('chat.visual.videoGen'),
      icon: <BellOutlined />,
      color: '#f97316' // Orange
    }
  ];

  // 确保有默认的描述文本
  const displayDescription = agentDescription || t('chat.defaultDescription');
  const displayName = agentName || t('chat.defaultAgentName');

  // H5版本的空聊天状态布局
  if (isMobile) {
    return (
      <div className="empty-chat-message-mobile">
        {/* 顶部AI生成提示 */}
        {/* <div className="ai-generated-tip">内容由 AI 生成</div> */}

        {/* 中心头像和欢迎区域 */}
        <div className="welcome-section">
          {agentAvatar && (
            <div className="agent-avatar-mobile">
              <img
                src={agentAvatar}
                alt={displayName}
                className="agent-avatar-img"
              />
            </div>
          )}

          <div className="agent-name-empty-container">{displayDescription}</div>
        </div>

        {/* 底部输入框 */}
        {!isReadOnly && (
          <div className="mobile-input-container">
            {/* 快捷功能按钮 */}
            <ChatInput
              userInput={userInput}
              setUserInput={setUserInput}
              attachments={attachments}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              isGenerating={isGenerating}
              handleSubmit={handleSubmit}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleVoiceInput={handleVoiceInput}
              handleAttachClick={handleAttachClick}
              handleRemoveFile={handleRemoveFile}
              handleFileUpload={handleFileUpload}
              handleStopGeneration={handleStopGeneration}
              getUploadProgressData={getUploadProgressData}
              agentId={agentId}
              inputRef={inputRef}
              fileInputRef={fileInputRef}
              editableDivRef={editableDivRef}
              agentName={agentName}
              className="mobile-centered"
              isMobile={isMobile}
              questionPrefix={questionPrefix}
              setQuestionPrefix={setQuestionPrefix}
              handleEditableChange={handleEditableChange}
              validatePlaceholders={validatePlaceholders}
              suggestedQuestions={
                <SuggestedQuestions
                  questions={suggestedQuestions}
                  onQuestionClick={onQuestionClick}
                  selectedQuestionId={selectedQuestionId}
                  disabled={disabled}
                  isMobile={isMobile}
                />
              }
            />
          </div>
        )}

        {/* 只读模式下显示提示信息 */}
        {isReadOnly && (
          <div className="readonly-empty-tip-mobile">
            {t("agent.shareChat")}
          </div>
        )}
      </div>
    );
  }

  // PC版本保持原有布局
  return (
    <div className="empty-chat-message">
      <h1 className="workspace-title">{t('chat.workspaceTitle')}</h1>
      
      {!isReadOnly && (
        <div className="centered-input-container">
          <ChatInput
            userInput={userInput}
            setUserInput={setUserInput}
            attachments={attachments}
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            isGenerating={isGenerating}
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
            handleVoiceInput={handleVoiceInput}
            handleAttachClick={handleAttachClick}
            handleRemoveFile={handleRemoveFile}
            handleFileUpload={handleFileUpload}
            handleStopGeneration={handleStopGeneration}
            getUploadProgressData={getUploadProgressData}
            agentId={agentId}
            inputRef={inputRef}
            fileInputRef={fileInputRef}
            editableDivRef={editableDivRef}
            agentName={agentName}
            className="centered"
            isMobile={isMobile}
            questionPrefix={questionPrefix}
            setQuestionPrefix={setQuestionPrefix}
            handleEditableChange={handleEditableChange}
            validatePlaceholders={validatePlaceholders}
          />
        </div>
      )}

      <div className="agent-grid-small">
        {/* 交互式智能体 - 带有点击效果 */}
        {interactiveAgents.map((agent) => (
          <div 
            key={agent.id} 
            className="agent-item interactive"
            onClick={() => !disabled && onQuestionClick({ text: agent.text, type: 'send', name: agent.label })}
            style={{ '--agent-color': agent.color } as React.CSSProperties}
          >
            <div className="agent-icon-wrapper" style={{ backgroundColor: `${agent.color}15`, color: agent.color }}>
              {agent.icon}
            </div>
            <span className="agent-label">{agent.label}</span>
          </div>
        ))}

        {/* 视觉展示智能体 - 无点击效果 */}
        {visualAgents.map((agent) => (
          <div 
            key={agent.id} 
            className="agent-item visual"
            style={{ '--agent-color': agent.color } as React.CSSProperties}
          >
            <div className="agent-icon-wrapper" style={{ backgroundColor: `${agent.color}15`, color: agent.color }}>
              {agent.icon}
            </div>
            <span className="agent-label">{agent.label}</span>
          </div>
        ))}
      </div>

      {/* 添加随机问题推荐  pc展示下面*/}
      {/* <SuggestedQuestions
        questions={suggestedQuestions}
        onQuestionClick={onQuestionClick}
        selectedQuestionId={selectedQuestionId}
        disabled={disabled}
        isMobile={isMobile}
      /> */}
      {/* 只读模式下显示提示信息 */}
      {isReadOnly && (
        <div className="readonly-empty-tip">{t("agent.shareChat")}</div>
      )}
    </div>
  );
};

export default EmptyChatState;
