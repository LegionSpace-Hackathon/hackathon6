// 输入框管理钩子
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface UseInputHandlingProps {
  agentName?: string;
  onSubmit?: (content: string) => void;
}

/**
 * 输入框管理钩子
 *
 * @param props 配置选项
 */
const useInputHandling = (props: UseInputHandlingProps = {}) => {
  const { agentName, onSubmit } = props;

  // 状态
  const [userInput, setUserInput] = useState('');
  const [selectedQuestionText, setSelectedQuestionText] = useState('');
  const editableDivRef = useRef<HTMLDivElement>(null);
 const { t } = useTranslation();
  // 从userInput中计算问题前缀

  // 处理输入变化，自动调整高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 检查是否为回车键
    if (e.key === 'Enter') {
      // 如果是回车键且没有按下Shift键，阻止默认行为并提交表单
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // 不在这里处理提交，由外部统一处理
      }
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 不在这里处理提交，由外部统一处理
  };

  // 清空输入框
  const clearInput = () => {
    setUserInput('');
    setSelectedQuestionText('');

    // 清理DOM
    if (editableDivRef.current) {
      editableDivRef.current.textContent = '';
      editableDivRef.current.removeAttribute('data-question-context');
      editableDivRef.current.removeAttribute('data-template');

      console.log(`${agentName}`)
      // 恢复默认placeholder
      const defaultPlaceholder = t('agent.messageTo').replace('{name}', `${agentName || '智能体'}`);
      editableDivRef.current.setAttribute('data-placeholder', defaultPlaceholder);
    }
  };

  // 设置输入内容（同时更新状态和DOM）
  const setInputWithDOM = (content: string) => {
    setUserInput(content);
    
    // 同步更新可编辑div的内容
    if (editableDivRef.current) {
      editableDivRef.current.textContent = content;
    }
  };

  // 设置输入内容（保持向后兼容）
  const setInput = (content: string) => {
    setInputWithDOM(content);
  };

  return {
    userInput,
    setUserInput,
    selectedQuestionText,
    setSelectedQuestionText,
    editableDivRef,
    handleInputChange,
    handleKeyDown,
    handleSubmit,
    clearInput,
    setInput,
    setInputWithDOM, // 导出新方法
  };
};

export default useInputHandling;
