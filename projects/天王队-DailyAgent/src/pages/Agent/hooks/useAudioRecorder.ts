import { useState, useRef, useEffect } from 'react';
import { isVoiceRecognitionSupported } from '../api/voiceService';

interface AudioRecorderResult {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  error: Error | null;
  recordingTime: number;
  recordingBlob: Blob | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
}

/**
 * 音频录制Hook
 */
const useAudioRecorder = (): AudioRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSupported = isVoiceRecognitionSupported();

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时释放资源
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 开始录音
  const startRecording = async () => {
    if (!isSupported) {
      setError(new Error('浏览器不支持录音'));
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      setRecordingTime(0);
      audioChunksRef.current = [];

      // 获取用户媒体
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 创建MediaRecorder实例
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // 处理数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 处理录音停止事件
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(audioBlob);
        
        // 释放媒体资源
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // 开始录音
      mediaRecorder.start();
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setIsRecording(false);
      setError(err instanceof Error ? err : new Error('录音失败'));
      console.error('录音初始化失败:', err);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // 释放媒体资源
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  };

  // 重置录音状态
  const resetRecording = () => {
    setRecordingBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  return {
    isRecording,
    isProcessing,
    isSupported,
    error,
    recordingTime,
    recordingBlob,
    startRecording,
    stopRecording,
    resetRecording
  };
};

export default useAudioRecorder;
