import apiClient from '../../../lib/apiClient';
import { mapAgentIdToType, getCurrentAgentId } from './difyStream';

/**
 * 语音识别服务配置
 */
const VOICE_API_URL = process.env.VITE_VOICE_API_URL || '/api/voice';

/**
 * 语音转文本响应接口
 */
interface SpeechToTextResponse {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * 将语音转换为文本
 * @param audioBlob 音频数据
 * @returns 识别结果
 */
export const speechToText = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await apiClient.post<SpeechToTextResponse>(
      `${VOICE_API_URL}/transcribe`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || '语音识别失败');
    }

    return response.data.text;
  } catch (error) {
    console.error('语音识别请求失败', error);
    throw error;
  }
};

/**
 * 检查浏览器是否支持语音识别
 */
export const checkVoiceSupport = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

/**
 * 调用Dify API将音频转换为文本
 * @param audioBlob 录制的音频Blob对象
 * @param agentId 代理ID，可选，如不提供则自动从URL获取
 * @returns 转换后的文本
 */
export const convertAudioToText = async (audioBlob: Blob, agentId?: string): Promise<string> => {
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('user', 'default_user');
    
    // 调用API
    const response = await fetch(`/api/dify/audio-to-text`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer ' + (process.env.VITE_DIFY_API_KEY || 'app-V03D3aZuDuNotQNoL4cRodyc'),
        'agentType': mapAgentIdToType(agentId)
      },
    });
    
    if (!response.ok) {
      throw new Error(`语音转换失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('语音转文字结果:', data);
    
    // 返回转换后的文本
    return data.text || '';
  } catch (error) {
    console.error('语音转文字请求失败:', error);
    throw error;
  }
};

/**
 * 检测浏览器是否支持语音识别
 * @returns 是否支持
 */
export const isVoiceRecognitionSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * 检测是否为移动设备
 * @returns 是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};