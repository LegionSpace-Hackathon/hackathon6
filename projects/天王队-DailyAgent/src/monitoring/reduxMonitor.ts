import { Middleware } from '@reduxjs/toolkit';
import { startMark, endMark } from './performance/performanceLogger';
import { reportPerformanceIssue } from './reporting/reportService';

/**
 * Redux性能监控中间件
 */
export const createPerformanceMiddleware = (): Middleware => {
  return store => next => action => {
    // 检查action是否有效
    if (!action || typeof action !== 'object') {
      console.warn('[Redux监控] 接收到无效的action:', action);
      return next(action);
    }
    
    const actionType = action.type || 'UNKNOWN_ACTION';
    const actionName = `Redux动作:${actionType}`;
    
    // 开始性能测量
    startMark(actionName);
    
    // 执行动作
    const result = next(action);
    
    // 结束性能测量
    endMark(actionName);
    
    return result;
  };
};

/**
 * 监控Redux状态大小的选择器
 */
export const monitorStateSize = (state: any) => {
  try {
    const stateSize = new TextEncoder().encode(JSON.stringify(state)).length;
    const sizeInKB = stateSize / 1024;
    
    if (sizeInKB > 500) {
      reportPerformanceIssue('Redux状态过大', sizeInKB);
      console.warn(`[Redux监控] 状态大小: ${sizeInKB.toFixed(2)}KB`);
    }
    
    return sizeInKB;
  } catch (error) {
    console.error('[Redux监控] 无法计算状态大小', error);
    return -1;
  }
};

/**
 * 监控Redux状态更新频率
 */
let updateCount = 0;
let lastWarningTime = 0;

export const monitorUpdateFrequency = () => {
  updateCount++;
  
  const now = Date.now();
  
  // 每秒检查一次更新频率
  if (now - lastWarningTime > 1000) {
    if (updateCount > 20) {
      reportPerformanceIssue('Redux更新频率过高', updateCount);
      console.warn(`[Redux监控] 状态更新频率: ${updateCount}次/秒`);
    }
    
    updateCount = 0;
    lastWarningTime = now;
  }
}; 