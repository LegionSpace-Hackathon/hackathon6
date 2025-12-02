/**
 * 全局错误处理器
 * 捕获和处理应用中的未捕获错误
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  type: 'error' | 'unhandledrejection';
  timestamp: number;
  url?: string;
  line?: number;
  column?: number;
}

// 错误队列，用于批量上报
const errorQueue: ErrorInfo[] = [];
const MAX_ERROR_QUEUE_SIZE = 10;

/**
 * 记录错误信息
 */
const logError = (errorInfo: ErrorInfo) => {
  // 添加到错误队列
  errorQueue.push(errorInfo);
  
  // 如果队列满了，清理旧的错误
  if (errorQueue.length > MAX_ERROR_QUEUE_SIZE) {
    errorQueue.shift();
  }
  
  // 开发环境打印详细信息
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 ${errorInfo.type} 错误`);
    console.error('消息:', errorInfo.message);
    console.error('堆栈:', errorInfo.stack);
    console.error('时间:', new Date(errorInfo.timestamp).toLocaleString());
    if (errorInfo.url) {
      console.error('文件:', errorInfo.url);
      console.error('位置:', `${errorInfo.line}:${errorInfo.column}`);
    }
    console.groupEnd();
  }
  
  // 生产环境可以在这里集成错误监控服务（如Sentry）
  if (process.env.NODE_ENV === 'production') {
    // TODO: 集成错误监控服务
    // Sentry.captureException(error);
  }
};

/**
 * 处理全局错误
 */
const handleGlobalError = (event: ErrorEvent) => {
  const errorInfo: ErrorInfo = {
    message: event.message,
    stack: event.error?.stack,
    type: 'error',
    timestamp: Date.now(),
    url: event.filename,
    line: event.lineno,
    column: event.colno,
  };
  
  logError(errorInfo);
  
  // 阻止默认的错误处理
  event.preventDefault();
};

/**
 * 处理未捕获的Promise拒绝
 */
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const errorInfo: ErrorInfo = {
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
    type: 'unhandledrejection',
    timestamp: Date.now(),
  };
  
  logError(errorInfo);
  
  // 阻止默认的错误处理
  event.preventDefault();
};

/**
 * 初始化全局错误处理
 */
export const initGlobalErrorHandler = () => {
  // 监听全局错误
  window.addEventListener('error', handleGlobalError);
  
  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  console.log('✅ 全局错误处理已初始化');
};

/**
 * 清理错误处理器
 */
export const cleanupGlobalErrorHandler = () => {
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
};

/**
 * 获取错误队列（用于调试）
 */
export const getErrorQueue = () => [...errorQueue];

/**
 * 清空错误队列
 */
export const clearErrorQueue = () => {
  errorQueue.length = 0;
};

export default {
  init: initGlobalErrorHandler,
  cleanup: cleanupGlobalErrorHandler,
  getErrors: getErrorQueue,
  clearErrors: clearErrorQueue,
};
