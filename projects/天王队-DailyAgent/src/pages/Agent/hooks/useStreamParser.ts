import { useState, useCallback, useRef } from 'react';
import { DifyStreamParser } from '../api/difyStream';

interface UseStreamParserOptions {
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
  onThinking?: () => void; // 新增：开始思考
  onMessageStart?: () => void; // 新增：开始输出消息
  onStreamError?: (errorMessage: string) => void; // 新增：流式错误
}

/**
 * 流式数据解析Hook
 * @param options 配置选项
 * @returns 流式解析器和状态
 */
export const useStreamParser = (options: UseStreamParserOptions = {}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isThinking, setIsThinking] = useState(false); // 新增：思考状态
  const contentRef = useRef<string>('');

  // 重置状态和内容
  const reset = useCallback(() => {
    contentRef.current = '';
    setIsStreaming(false);
    setIsThinking(false);
    setError(null);
  }, []);

  // 创建流式解析器
  const createParser = useCallback(
    (
      onMessageCallback: (content: string) => void,
      messageId: string
    ): DifyStreamParser => {
      return {
        onThinking: () => {
          console.log('开始思考状态');
          setIsThinking(true);
          setIsStreaming(true);
          
          if (options.onThinking) {
            options.onThinking();
          }
        },
        onMessageStart: () => {
          console.log('开始输出消息');
          setIsThinking(false);
          
          if (options.onMessageStart) {
            options.onMessageStart();
          }
        },
        onMessage: (message: string) => {
          contentRef.current += message;
          onMessageCallback(message);
        },
        onData: (data: any) => {
          setIsStreaming(true);
          
          if (options.onData) {
            options.onData(data);
          }
        },
        onStreamError: (errorMessage: string) => {
          console.error('流式错误:', errorMessage);
          setError(new Error(errorMessage));
          setIsStreaming(false);
          setIsThinking(false);
          
          if (options.onStreamError) {
            options.onStreamError(errorMessage);
          }
        },
        onError: (err: Error) => {
          console.error('流式解析器错误:', err);
          setError(err);
          setIsStreaming(false);
          setIsThinking(false);
          
          if (options.onError) {
            options.onError(err);
          }
        },
        onDone: () => {
          setIsStreaming(false);
          setIsThinking(false);
          
          if (options.onDone) {
            options.onDone();
          }
        },
      };
    },
    [options]
  );

  return {
    isStreaming,
    isThinking, // 新增：思考状态
    error,
    content: contentRef.current,
    createParser,
    reset,
  };
};

export default useStreamParser; 