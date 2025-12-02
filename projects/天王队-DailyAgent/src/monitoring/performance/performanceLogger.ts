import { reportPerformanceIssue } from '../reporting/reportService';

interface PerfEntry {
  name: string;
  type: 'mark' | 'measure';
  start?: number;
  duration?: number;
}

const performanceEntries: Record<string, PerfEntry> = {};

/**
 * 开始一个性能标记
 */
export const startMark = (name: string) => {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    // 先尝试清除可能存在的旧标记，避免重复
    performance.clearMarks(name);
    performance.mark(name);
    
    performanceEntries[name] = { 
      name, 
      type: 'mark',
      start: performance.now()
    };
    
    // 确保我们可以跟踪这个标记已经创建
    console.debug(`[性能监控] 创建标记: ${name}`);
  } catch (error) {
    console.error(`[性能监控] 创建标记出错: ${name}`, error);
  }
};

/**
 * 结束一个性能标记并测量
 */
export const endMark = (name: string) => {
  if (typeof window === 'undefined' || !window.performance) return;
  
  // 如果没有对应的开始标记记录，则创建一个
  if (!performanceEntries[name]) {
    console.warn(`[性能监控] 没有找到开始标记: ${name}，将跳过测量`);
    return;
  }
  
  try {
    // 创建结束标记
    const endMarkName = `${name}-end`;
    performance.clearMarks(endMarkName);
    performance.mark(endMarkName);
    
    // 获取标记是否存在
    const startMarkExists = performance.getEntriesByName(name, 'mark').length > 0;
    const endMarkExists = performance.getEntriesByName(endMarkName, 'mark').length > 0;
    
    if (!startMarkExists) {
      console.warn(`[性能监控] 测量失败: 找不到开始标记 '${name}'`);
      return;
    }
    
    if (!endMarkExists) {
      console.warn(`[性能监控] 测量失败: 找不到结束标记 '${endMarkName}'`);
      return;
    }
    
    // 进行测量
    performance.measure(name, name, endMarkName);
    const entries = performance.getEntriesByName(name, 'measure');
    const duration = entries.length > 0 ? entries[0].duration : undefined;
    
    if (duration !== undefined) {
      performanceEntries[name] = {
        ...performanceEntries[name],
        type: 'measure',
        duration,
      };
      
      console.debug(`[性能监控] 测量完成: ${name} (${duration.toFixed(2)}ms)`);
      
      // 记录超时操作
      if (duration > 100) {
        console.warn(`[性能监控] 检测到长任务: ${name} (${duration.toFixed(2)}ms)`);
        reportPerformanceIssue(`长任务: ${name}`, duration);
      }
    }
  } catch (error) {
    console.error(`[性能监控] 测量出错: ${name}`, error);
    
    // 如果测量失败，我们仍然计算一个近似的持续时间
    if (performanceEntries[name]?.start) {
      const approximateDuration = performance.now() - performanceEntries[name].start!;
      performanceEntries[name] = {
        ...performanceEntries[name],
        type: 'measure',
        duration: approximateDuration,
      };
      console.debug(`[性能监控] 使用近似测量: ${name} (${approximateDuration.toFixed(2)}ms)`);
    }
  } finally {
    // 清理标记
    try {
      performance.clearMarks(name);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } catch (e) {
      // 忽略清理错误
    }
  }
};

/**
 * 直接测量函数执行时间
 */
export const measureFn = <T>(name: string, fn: () => T): T => {
  startMark(name);
  try {
    return fn();
  } finally {
    endMark(name);
  }
};

/**
 * 创建一个高阶函数，用于测量函数执行时间
 */
export const withPerformance = <T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T => {
  return ((...args: any[]) => {
    startMark(name);
    try {
      return fn(...args);
    } finally {
      endMark(name);
    }
  }) as T;
};

/**
 * 获取所有性能条目
 */
export const getPerformanceEntries = () => ({ ...performanceEntries });

/**
 * 重置性能条目
 */
export const resetPerformanceEntries = () => {
  Object.keys(performanceEntries).forEach((key) => {
    delete performanceEntries[key];
  });
}; 