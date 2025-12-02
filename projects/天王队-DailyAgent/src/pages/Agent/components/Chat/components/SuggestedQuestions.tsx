import React from 'react';

// 定义预设问题类型接口
export interface PresetQuestion {
  text: string;
  type: 'send' | 'template' | 'placeholder'; // 添加 placeholder 类型
  template?: string; // 当type为template或placeholder时，使用的模板文本
  name?: string; // 当type为placeholder时，使用的名称
  id?: string; // 用于标识问题，控制选中状态
}

interface SuggestedQuestionsProps {
  questions: PresetQuestion[];
  onQuestionClick: (question: PresetQuestion) => void;
  selectedQuestionId?: string; // 当前选中的问题ID
  className?: string;
  disabled?: boolean; // 是否禁用点击
  isMobile?: boolean; // 是否是移动端
}

/**
 * 推荐问题组件
 */
const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ 
  questions, 
  onQuestionClick,
  isMobile = false,
  selectedQuestionId,
  className = '',
  disabled = false
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }
  
  return (
    <div className={`suggested-questions-container ${className} ${isMobile ? 'suggested-questions-container-mobile' : ''}`}>
      <div className="suggested-questions">
        {questions.map((question, index) => {
          const isSelected = selectedQuestionId && question.id === selectedQuestionId;
          return (
            <div 
              key={question.id || index}
              className={`suggested-question-item ${question.type === 'template' ? 'template-type' : ''} ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && onQuestionClick(question)}
            >
              <span>{question.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedQuestions; 