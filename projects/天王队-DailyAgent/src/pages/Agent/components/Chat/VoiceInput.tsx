import React, { useState, useEffect } from 'react';
import './VoiceInput.scss';
import { isApp, getUAType } from '../../../../utils/uaHelper';
import { callNativeMethods } from '../../../../utils/chainpal-utils-0.0.4.js';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
  agentId: string;
}

/**
 * 语音输入组件
 * 仅在App环境中显示
 * 调用原生语音识别功能
 */
const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscription, 
  disabled = false, 
  className = '',
  agentId
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 如果不在App环境中，不渲染组件
  if (!isApp() || getUAType === 'pc') {
    return null;
  }

  // 处理语音识别结果回调
  const handleVoiceRecognitionResult = (resultJson: string) => {
    try {
      const result = JSON.parse(resultJson);
      
      // 重置状态
      setIsProcessing(false);
      setIsRecording(false);
      
      if (result.code === 0 && result.data) {
        // 识别成功，将文本传回父组件
        onTranscription(result.data);
      } else {
        // 识别失败，显示错误
        setError(result.errMsg || '语音识别失败');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('语音识别结果解析失败:', err);
      setError('语音识别结果解析失败');
      setTimeout(() => setError(null), 3000);
      
      // 重置状态
      setIsProcessing(false);
      setIsRecording(false);
    }
  };

  // 启动语音识别
  const startVoiceRecognition = () => {
    if (disabled) return;

    // setIsRecording(true);
    // setIsProcessing(true);
    setError(null);

    // 调用原生语音识别功能
    callNativeMethods('RecordingToString', null, handleVoiceRecognitionResult);
  };

  return (
    <div 
      className={`voice-input ${className} ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
      onClick={startVoiceRecognition}
    >      
      {isProcessing ? (
        <div className="voice-icon processing">
          <div className="processing-spinner"></div>
        </div>
      ) : (
        <div className="voice-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
      )}
      
      {error && <div className="voice-error">{error}</div>}
      
      {/* <span className="voice-tooltip">
        {isRecording ? '正在录音...' : '点击录音'}
      </span> */}
    </div>
  );
};

export default VoiceInput;