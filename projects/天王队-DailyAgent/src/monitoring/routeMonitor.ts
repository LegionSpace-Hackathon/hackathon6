import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { startMark, endMark } from './performance/performanceLogger';

/**
 * 路由切换性能监控Hook
 * 用于测量路由加载时间
 */
export const useRouteMonitor = () => {
  const location = useLocation();
  const routeKeyRef = useRef<string>('');

  useEffect(() => {
    // 创建唯一的路由标识符，使用时间戳避免路由重复问题
    const timestamp = Date.now();
    const path = location.pathname;
    const routeKey = `路由加载:${path}:${timestamp}`;
    
    // 保存当前路由标识符，便于清理
    routeKeyRef.current = routeKey;
    
    // 记录路由变化
    console.log(`[路由监控] 路由变化: ${path}`);
    
    // 开始测量
    startMark(routeKey);
    
    // 创建一个DOM内容加载的测量点
    const domContentLoadedKey = `${routeKey}:DOM就绪`;
    startMark(domContentLoadedKey);
    
    // 组件挂载完成，DOM内容已经就绪
    setTimeout(() => {
      endMark(domContentLoadedKey);
    }, 0);
    
    // 使用requestAnimationFrame来确保在下一帧渲染后测量
    const rafCallback = () => {
      // 使用requestIdleCallback或setTimeout等待页面完全稳定
      if (typeof window !== 'undefined') {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            endMark(routeKey);
          });
        } else {
          // 对于不支持requestIdleCallback的浏览器，使用setTimeout
          setTimeout(() => {
            endMark(routeKey);
          }, 100);
        }
      }
    };
    
    // 等待两帧以确保页面渲染完成
    requestAnimationFrame(() => {
      requestAnimationFrame(rafCallback);
    });
    
    // 清理函数
    return () => {
      // 如果路由变化太快，可能上一个测量还没有完成
      // 这里手动结束上一个测量
      if (routeKeyRef.current && routeKeyRef.current !== routeKey) {
        endMark(routeKeyRef.current);
      }
    };
  }, [location.pathname]);
}; 