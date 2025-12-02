/**
 * 性能优化工具
 * 用于检测设备性能并应用相应的优化策略
 */

/**
 * 设备性能等级
 */
export enum DevicePerformance {
  HIGH = 'high',      // 高性能设备
  MEDIUM = 'medium',  // 中等性能设备
  LOW = 'low'         // 低性能设备（老款机型）
}

/**
 * 检测设备性能等级
 */
export const detectDevicePerformance = (): DevicePerformance => {
  // 1. 检查硬件并发数（CPU核心数）
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  
  // 2. 检查设备内存（如果可用）
  const deviceMemory = (navigator as any).deviceMemory;
  
  // 3. 检查像素比
  const pixelRatio = window.devicePixelRatio || 1;
  
  // 4. 检查是否是移动设备
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // 5. 通过性能API检测
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const effectiveType = connection?.effectiveType;
  
  // 评分系统
  let score = 0;
  
  // CPU核心数评分
  if (hardwareConcurrency >= 8) score += 3;
  else if (hardwareConcurrency >= 4) score += 2;
  else score += 1;
  
  // 内存评分
  if (deviceMemory) {
    if (deviceMemory >= 8) score += 3;
    else if (deviceMemory >= 4) score += 2;
    else score += 1;
  } else {
    score += 2; // 默认中等
  }
  
  // 像素比评分（高像素比需要更多性能）
  if (pixelRatio <= 1.5) score += 1;
  else if (pixelRatio <= 2) score += 0;
  else score -= 1;
  
  // 移动设备降级
  if (isMobile) score -= 1;
  
  // 网络类型评分
  if (effectiveType === 'slow-2g' || effectiveType === '2g') score -= 2;
  else if (effectiveType === '3g') score -= 1;
  
  // 根据评分返回性能等级
  if (score >= 6) return DevicePerformance.HIGH;
  if (score >= 3) return DevicePerformance.MEDIUM;
  return DevicePerformance.LOW;
};

/**
 * 获取针对设备性能的优化配置
 */
export const getPerformanceConfig = (performance: DevicePerformance) => {
  switch (performance) {
    case DevicePerformance.HIGH:
      return {
        enableAnimations: true,
        batchUpdateDelay: 16, // ~60fps
        scrollUpdateDelay: 16,
        maxVisibleMessages: Infinity,
        enableSmoothScroll: true,
      };
      
    case DevicePerformance.MEDIUM:
      return {
        enableAnimations: true,
        batchUpdateDelay: 33, // ~30fps
        scrollUpdateDelay: 33,
        maxVisibleMessages: 100,
        enableSmoothScroll: true,
      };
      
    case DevicePerformance.LOW:
      return {
        enableAnimations: false,
        batchUpdateDelay: 100, // ~10fps
        scrollUpdateDelay: 100,
        maxVisibleMessages: 50,
        enableSmoothScroll: false,
      };
  }
};

/**
 * 使用requestAnimationFrame的节流函数
 * 针对老设备优化的滚动和渲染
 */
export const rafThrottle = <T extends (...args: any[]) => void>(
  callback: T
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          callback(...lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastArgs = null;
    }
  };

  return throttled as ((...args: Parameters<T>) => void) & { cancel: () => void };
};

/**
 * 防抖函数 - 用于减少频繁操作
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

/**
 * 批量DOM更新优化
 * 将多个DOM操作合并到一个帧中执行
 */
export class BatchProcessor {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private rafId: number | null = null;

  add(task: () => void): void {
    this.queue.push(task);
    this.schedule();
  }

  private schedule(): void {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.process();
      });
    }
  }

  private process(): void {
    this.isProcessing = true;
    
    const tasks = [...this.queue];
    this.queue = [];
    
    try {
      tasks.forEach(task => task());
    } finally {
      this.isProcessing = false;
      this.rafId = null;
      
      // 如果还有待处理任务，继续调度
      if (this.queue.length > 0) {
        this.schedule();
      }
    }
  }

  clear(): void {
    this.queue = [];
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing = false;
  }
}

// 全局性能配置实例
let cachedPerformance: DevicePerformance | null = null;
let cachedConfig: ReturnType<typeof getPerformanceConfig> | null = null;

/**
 * 获取当前设备的性能配置（带缓存）
 */
export const getCurrentPerformanceConfig = () => {
  if (!cachedPerformance) {
    cachedPerformance = detectDevicePerformance();
    cachedConfig = getPerformanceConfig(cachedPerformance);
    
    // 在控制台输出性能等级，便于调试
    console.log(`[Performance] Device performance level: ${cachedPerformance}`, cachedConfig);
  }
  
  return cachedConfig!;
};

/**
 * 重置性能检测缓存（用于测试或配置变更）
 */
export const resetPerformanceCache = () => {
  cachedPerformance = null;
  cachedConfig = null;
};

