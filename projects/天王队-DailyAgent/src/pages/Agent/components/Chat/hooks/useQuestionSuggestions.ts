import { useState, useCallback, useEffect } from 'react';
import { PresetQuestion } from '../components/SuggestedQuestions';
import { ExtendedFileInfo } from './useFileUpload';
import { useTranslation } from 'react-i18next';

interface UseQuestionSuggestionsOptions {
  /**
   * 场景类型，影响问题推荐的内容
   * general: 通用场景
   * sales: 销售场景
   */
  scenarioType?: 'general' | 'sales';

  /**
   * 发送消息的回调
   */
  onSendMessage?: (message: string) => void;

  /**
   * 智能体名称，用于默认placeholder
   */
  agentName?: string;

  /**
   * 是否正在生成回复
   */
  isGenerating?: boolean;

  /**
   * 是否正在提交消息
   */
  isSubmitting?: boolean;

  /**
   * 是否正在上传文件
   */
  isUploading?: boolean;

  /**
   * 当前附件列表
   */
  attachments?: ExtendedFileInfo[];

  /**
   * 设置输入框内容的回调
   */
  setInputContent?: (content: string) => void;

  /**
   * 可编辑div的引用
   */
  editableDivRef?: React.RefObject<HTMLDivElement>;
}

/**
 * 问题推荐钩子
 */
const useQuestionSuggestions = (options: UseQuestionSuggestionsOptions = {}) => {
  const {
    scenarioType = 'general',
    onSendMessage,
    agentName,
    isGenerating = false,
    isSubmitting = false,
    isUploading = false,
    attachments = [],
    setInputContent,
    editableDivRef
  } = options;

  // 推荐问题状态
  const [suggestedQuestions, setSuggestedQuestions] = useState<PresetQuestion[]>([]);
  // 选中的问题ID（用于控制按钮样式）
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  // 记录上一次的附件数量，用于检测附件变化
  const [lastAttachmentCount, setLastAttachmentCount] = useState<number>(0);

  // 检查是否应该禁用问题点击
  const isDisabled = isGenerating || isSubmitting || isUploading;
  const { t } = useTranslation()

  // 通用预设问题列表
  const SUGGESTED_QUESTIONS: PresetQuestion[] = [
    { text: t('agent.productServiceDesc'), type: "send", name: t('agent.productService') },
    { text: t('agent.typicalClientDesc'), type: "send", name: t('agent.typicalClient') },
    { text: t('agent.contactUsDesc'), type: "send", name: t('agent.contactUs') }
  ];

  // 销售预设问题列表
  const SALES_PRESET_QUESTIONS: PresetQuestion[] = [
    { text: t('agent.searchCompany'), type: "placeholder", template: t('agent.companyPlaceholder'), name: t('agent.searchCompany') },
    { text: t('agent.explorOpportunity'), type: "placeholder", template: t('agent.opportunityPlaceholder'), name: t('agent.explorOpportunity') },
    { text: t('agent.inputLead'), type: "placeholder", template: t('agent.leadPlaceholder'), name: t('agent.inputLead') },
  ];

  // 生成随机问题
  const generateRandomQuestions = useCallback(() => {
    // 根据场景类型选择问题集
    const questionSet = scenarioType === 'sales'
      ? SALES_PRESET_QUESTIONS
      : SUGGESTED_QUESTIONS;

    // 为每个问题添加唯一ID
    return questionSet.slice(0, 3).map((question, index) => ({
      ...question,
      id: `${scenarioType}-${index}-${Date.now()}`
    }));
  }, [scenarioType]);

  // 初始化问题集
  const initializeQuestions = useCallback(() => {
    if (suggestedQuestions.length === 0) {
      setSuggestedQuestions(generateRandomQuestions());
    }
  }, [suggestedQuestions.length, generateRandomQuestions]);

  // 检查是否选中了"录入线索和联系人"问题
  const isLeadEntrySelected = useCallback(() => {
    if (!selectedQuestionId) return false;
    const selectedQuestion = suggestedQuestions.find(q => q.id === selectedQuestionId);
    return selectedQuestion?.name === t('agent.inputLead');
  }, [selectedQuestionId, suggestedQuestions]);

  // 生成参考附件的提示文本
  const generateAttachmentPrompt = useCallback((files: ExtendedFileInfo[]) => {
    if (files.length === 0) return '';

    // const fileDescriptions = files.map(file => {
    //   const fileName = file.name || '未知文件';
    //   const fileSize = file.size ? `(${(file.size / 1024).toFixed(1)}KB)` : '';

    //   // 根据文件类型生成不同的描述
    //   if (file.type?.startsWith('image/')) {
    //     return `图片文件: ${fileName} ${fileSize}`;
    //   } else if (file.type?.includes('pdf')) {
    //     return `PDF文档: ${fileName} ${fileSize}`;
    //   } else if (file.type?.includes('word') || file.type?.includes('document')) {
    //     return `Word文档: ${fileName} ${fileSize}`;
    //   } else if (file.type?.includes('excel') || file.type?.includes('spreadsheet')) {
    //     return `Excel表格: ${fileName} ${fileSize}`;
    //   } else if (file.type?.includes('powerpoint') || file.type?.includes('presentation')) {
    //     return `PPT演示: ${fileName} ${fileSize}`;
    //   } else {
    //     return `文件: ${fileName} ${fileSize}`;
    //   }
    // });

    return t('agent.inputTip');
  }, []);

  // 监听附件变化，自动填入提示文本
  useEffect(() => {
    const currentAttachmentCount = attachments.length;

    // 检查是否满足条件：选中了"录入线索"问题 且 有新的附件上传
    if (isLeadEntrySelected() && currentAttachmentCount > lastAttachmentCount) {
      const newFiles = attachments.slice(lastAttachmentCount);
      const promptText = generateAttachmentPrompt(newFiles);

      if (promptText && setInputContent) {
        // 设置输入框内容
        setInputContent(promptText);

        // 如果使用可编辑div，也更新其内容
        if (editableDivRef?.current) {
          editableDivRef.current.textContent = promptText;
          // 触发input事件以确保状态同步
          const inputEvent = new Event('input', { bubbles: true });
          editableDivRef.current.dispatchEvent(inputEvent);
        }
      }
    }

    // 更新附件数量记录
    setLastAttachmentCount(currentAttachmentCount);
  }, [attachments, isLeadEntrySelected, lastAttachmentCount, generateAttachmentPrompt, setInputContent, editableDivRef]);

  // 监听选中问题变化，处理输入框内容清理
  useEffect(() => {
    // 获取当前选中的问题
    const selectedQuestion = selectedQuestionId ? suggestedQuestions.find(q => q.id === selectedQuestionId) : null;

    // 注意：当没有选中任何问题时，不清空输入框内容，允许用户正常输入
    // 注意：当选中任何问题时，都不在这里清空，而是在点击时处理
    // 注意：当"录入线索"问题没有附件时，也不清空内容，允许用户正常输入
  }, [selectedQuestionId, suggestedQuestions, attachments.length, setInputContent, editableDivRef]);

  // 处理问题点击
  const handleQuestionClick = useCallback((
    question: PresetQuestion & { id?: string },
    inputElement?: HTMLDivElement
  ) => {
    // 如果正在生成、提交或上传，禁止点击
    if (isDisabled) {
      return;
    }

    const questionId = question.id || '';

    if (question.type === 'send') {
      // 发送类型，直接发送消息（不设置输入框内容）
      if (onSendMessage) {
        onSendMessage(question.text);
      }
      // 生成新问题
      setSuggestedQuestions(generateRandomQuestions());
    } else if (question.type === 'placeholder' && question.template) {
      // placeholder类型：切换选中状态
      if (selectedQuestionId === questionId) {
        // 已选中，取消选中
        setSelectedQuestionId('');
        // 恢复默认placeholder
        if (inputElement) {
          const defaultPlaceholder = t('agent.messageTo').replace('{name}', `${agentName}`)//`给${agentName || '智能体'}发送消息...`;
          inputElement.setAttribute('data-placeholder', defaultPlaceholder);
        }
        // 注意：取消选择时不清空输入框内容，允许用户继续输入
      } else {
        // 设置新的选中状态
        setSelectedQuestionId(questionId);
        // 更新placeholder为问题模板
        if (inputElement) {
          inputElement.setAttribute('data-placeholder', question.template);
        }

        // 如果是"录入线索"问题且已有附件，立即生成提示文本
        if (question.name === t('agent.inputLead') && attachments.length > 0) {
          const promptText = generateAttachmentPrompt(attachments);
          if (promptText && setInputContent) {
            setInputContent(promptText);
            if (editableDivRef?.current) {
              editableDivRef.current.textContent = promptText;
              const inputEvent = new Event('input', { bubbles: true });
              editableDivRef.current.dispatchEvent(inputEvent);
            }
          }
        }
        // 注意：切换快捷提示语时不清空输入框内容，保持用户已输入的内容
        // 只更新placeholder，让用户继续编辑已有内容
      }
    }
  }, [selectedQuestionId, generateRandomQuestions, onSendMessage, agentName, isDisabled, attachments, generateAttachmentPrompt, setInputContent, editableDivRef]);

  // 重置选中状态（发送消息后调用）
  const resetSelection = useCallback((inputElement?: HTMLDivElement) => {
    setSelectedQuestionId('');
    setLastAttachmentCount(0); // 重置附件计数
    if (inputElement) {
      console.log(`${agentName}`)
      const defaultPlaceholder = t('agent.messageTo').replace('{name}', `${agentName}`);
      inputElement.setAttribute('data-placeholder', defaultPlaceholder);
    }
  }, [agentName]);

  return {
    suggestedQuestions,
    setSuggestedQuestions,
    selectedQuestionId,
    generateRandomQuestions,
    initializeQuestions,
    handleQuestionClick,
    resetSelection,
    isDisabled,
    isLeadEntrySelected: isLeadEntrySelected()
  };
};

export default useQuestionSuggestions; 