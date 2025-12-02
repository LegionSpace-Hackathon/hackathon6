import React, { Suspense, LazyExoticComponent, ComponentType } from 'react';
import '../components/common/ErrorBoundary.scss';

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('路由组件错误:', error, errorInfo);
    
    // 防死循环机制：检查刷新次数
    const RELOAD_LIMIT = 3; // 最大刷新次数
    const TIME_WINDOW = 30000; // 时间窗口：30秒
    const STORAGE_KEY = 'route_error_boundary_reload_count';
    const TIMESTAMP_KEY = 'route_error_boundary_reload_timestamp';
    
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
          console.error('路由错误刷新次数过多，停止自动刷新');
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(TIMESTAMP_KEY);
          // 设置错误状态，让render显示错误UI
          this.setState({ hasError: true, error });
          return;
        }
      }
    } catch (storageError) {
      // 如果sessionStorage不可用，也停止刷新
      console.error('无法访问sessionStorage，停止自动刷新:', storageError);
      this.setState({ hasError: true, error });
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
      // 只有在刷新次数过多时才显示错误UI，否则返回null（会立即刷新）
      // 检查是否是因为刷新次数过多而停止刷新
      try {
        const STORAGE_KEY = 'route_error_boundary_reload_count';
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
          <div className="error-content">
            <h3>页面加载失败</h3>
            <p>页面遇到了问题，已尝试自动恢复但未成功。请手动刷新页面。</p>
            <button 
              onClick={() => {
                // 清除刷新计数，允许重新尝试
                try {
                  sessionStorage.removeItem('route_error_boundary_reload_count');
                  sessionStorage.removeItem('route_error_boundary_reload_timestamp');
                } catch {}
                window.location.reload();
              }} 
              className="retry-button"
            >
              重新加载页面
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '10px' }}>
                <summary>错误详情</summary>
                <pre style={{ fontSize: '12px', color: '#666' }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 默认错误回退组件（已废弃，不再使用，错误时会自动刷新页面）
// 保留此组件以防其他地方引用，但实际不会渲染（render 方法直接返回 null）
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = () => {
  return null;
};

// 加载中组件
export const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner"></div>
  </div>
);

// 带有Suspense的组件包装器
export const withSuspense = (Component: LazyExoticComponent<any>) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// ============ 路由预加载优化 ============
/**
 * 预加载关键路由组件
 * 在浏览器空闲时预加载高频访问的页面，提升用户体验
 */
export const preloadRoutes = () => {
  // 预加载 Agent 页面
  import('../pages/Agent');
};

/**
 * 在应用启动时预加载关键路由
 * 使用requestIdleCallback在空闲时加载，不影响首屏性能
 */
export const initRoutePreload = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadRoutes();
      console.log('关键路由预加载完成');
    }, { timeout: 3000 }); // 3秒超时
  } else {
    // 对于不支持requestIdleCallback的浏览器，延迟2秒后加载
    setTimeout(() => {
      preloadRoutes();
      console.log('关键路由预加载完成（降级方案）');
    }, 2000);
  }
}; 