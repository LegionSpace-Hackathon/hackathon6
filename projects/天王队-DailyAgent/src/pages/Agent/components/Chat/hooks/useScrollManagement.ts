// 聊天界面滚动管理钩子
import { useState, useRef, useEffect, useCallback } from 'react';

interface ScrollManagementOptions {
  observeElement?: boolean;  // 是否观察元素大小变化
  autoScrollTolerance?: number; // 自动滚动触发的距离容器底部容差
}

/**
 * 聊天界面滚动管理钩子
 * 
 * @param containerRef 容器元素的引用
 * @param options 配置选项
 */
const useScrollManagement = (
  containerRef: React.RefObject<HTMLElement>,
  options?: ScrollManagementOptions
) => {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastScrollPositionRef = useRef(0);
  const lastScrollHeightRef = useRef(0);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tolerance = options?.autoScrollTolerance || 30;

  // 检测是否在容器底部附近
  const checkIsNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    // 判断是否在底部附近（距离底部tolerance以内）
    const isNear = container.scrollHeight - container.scrollTop - container.clientHeight <= tolerance;
    setIsNearBottom(isNear);
    return isNear;
  }, [containerRef, tolerance]);

  // 滚动到底部
  const scrollToBottom = useCallback((force = false) => {
    if (containerRef.current && (shouldAutoScroll || force)) {
      const container = containerRef.current;

      // 取消任何之前的自动滚动超时
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }

      // 使用setTimeout确保在DOM更新后滚动
      autoScrollTimeoutRef.current = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 10);
    }
  }, [shouldAutoScroll, containerRef]);

  // 流式内容更新时的滚动处理
  const handleStreamUpdate = useCallback((isStreaming = false) => {
    // 检查容器是否存在
    const container = containerRef.current;
    if (!container) return;

    // 计算是否需要滚动
    const currentScrollHeight = container.scrollHeight;
    const currentScrollPosition = container.scrollTop;

    // 如果之前用户在底部附近，则继续滚动
    if (checkIsNearBottom()) {
      container.scrollTop = currentScrollHeight;
      setShouldAutoScroll(true);
    } else if (isStreaming) {
      // 如果是流式输出中，且高度变化明显，可能需要调整滚动
      const heightDifference = currentScrollHeight - lastScrollHeightRef.current;

      // 如果高度变化显著，可能是新内容，调整滚动位置保持相对位置不变
      if (heightDifference > 10) {
        // 保持相对滚动位置不变（用户看到的内容不变）
        container.scrollTop = currentScrollPosition + heightDifference;
      }
    }

    // 更新参考值
    lastScrollHeightRef.current = currentScrollHeight;
    lastScrollPositionRef.current = container.scrollTop;
  }, [containerRef, checkIsNearBottom]);


 
  // 返回有用的状态和方法
  return {
    isNearBottom,
    shouldAutoScroll,
    setShouldAutoScroll,
    scrollToBottom,
    handleStreamUpdate,
  };
};

export default useScrollManagement; 