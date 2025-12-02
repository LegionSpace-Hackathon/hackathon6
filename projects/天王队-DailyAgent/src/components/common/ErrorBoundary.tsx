import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.scss';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * 错误边界组件
 * 用于捕获子组件中的JavaScript错误
 * 检测到错误时会自动清理存储（如需要）并强制刷新页面恢复
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state使下一次渲染能够显示降级后的UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary捕获到错误:', error, errorInfo);
    
    // 防死循环机制：检查刷新次数
    const RELOAD_LIMIT = 3; // 最大刷新次数
    const TIME_WINDOW = 30000; // 时间窗口：30秒
    const STORAGE_KEY = 'error_boundary_reload_count';
    const TIMESTAMP_KEY = 'error_boundary_reload_timestamp';
    
    try {
      const now = Date.now();
      const reloadCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
      const lastTimestamp = parseInt(sessionStorage.getItem(TIMESTAMP_KEY) || '0', 10);
      
      // 如果超过时间窗口，重置计数
      if (now - lastTimestamp > TIME_WINDOW) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        sessionStorage.setItem(TIMESTAMP_KEY, now.toString());
      } else {
        // 在时间窗口内，增加计数
        const newCount = reloadCount + 1;
        sessionStorage.setItem(STORAGE_KEY, newCount.toString());
        sessionStorage.setItem(TIMESTAMP_KEY, now.toString());
        
        // 如果超过限制，停止刷新，显示错误信息
        if (newCount >= RELOAD_LIMIT) {
          console.error('错误刷新次数过多，停止自动刷新');
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(TIMESTAMP_KEY);
          // 设置错误状态，让render显示错误UI
          this.setState({ hasError: true, error, errorInfo });
          return;
        }
      }
    } catch (storageError) {
      // 如果sessionStorage不可用，也停止刷新
      console.error('无法访问sessionStorage，停止自动刷新:', storageError);
      this.setState({ hasError: true, error, errorInfo });
      return;
    }
    
    // 检查是否是存储相关错误，如果是则先清理
    if (error.name === 'QuotaExceededError' || error.message.includes('localStorage')) {
      console.warn('检测到存储相关错误，尝试清理');
      try {
        // 清理所有agent相关的存储项
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('agent_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (cleanupError) {
        console.error('清理存储失败:', cleanupError);
      }
    }

    // 所有错误都直接强制刷新页面，不显示错误UI
    // 使用 setTimeout 确保清理操作完成后再刷新
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的fallback UI，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 只有在刷新次数过多时才显示错误UI，否则返回null（会立即刷新）
      // 检查是否是因为刷新次数过多而停止刷新
      try {
        const STORAGE_KEY = 'error_boundary_reload_count';
        const reloadCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
        
        // 如果还有刷新计数，说明是正常刷新流程，返回null
        if (reloadCount > 0 && reloadCount < 3) {
          return null;
        }
      } catch {
        // 如果无法访问sessionStorage，显示错误UI
      }

      // 刷新次数过多或无法访问存储，显示错误UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">页面出现错误</h2>
            <p className="error-message">
              页面遇到了问题，已尝试自动恢复但未成功。请手动刷新页面。
            </p>
            <div className="error-actions">
              <button 
                className="error-button primary" 
                onClick={() => {
                  // 清除刷新计数，允许重新尝试
                  try {
                    sessionStorage.removeItem('error_boundary_reload_count');
                    sessionStorage.removeItem('error_boundary_reload_timestamp');
                  } catch {}
                  window.location.reload();
                }}
              >
                重新加载页面
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="error-technical">
                <summary>技术详情 (开发模式)</summary>
                <pre>{this.state.error?.stack}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
