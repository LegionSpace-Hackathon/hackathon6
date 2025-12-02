import React, { Profiler, ProfilerOnRenderCallback, PropsWithChildren } from 'react';
import { reportPerformanceIssue } from '../reporting/reportService';

type RenderMetrics = Record<string, {
  renderCount: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
}>;

const metrics: RenderMetrics = {};

/**
 * 获取组件渲染指标
 */
export const getRenderMetrics = () => ({ ...metrics });

/**
 * 通用Profiler回调函数
 */
const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  // 忽略开发环境下的严格模式重复渲染
  if (phase === 'mount' && metrics[id] && process.env.NODE_ENV === 'development') {
    return;
  }

  if (!metrics[id]) {
    metrics[id] = {
      renderCount: 1,
      totalTime: actualDuration,
      minTime: actualDuration,
      maxTime: actualDuration,
      avgTime: actualDuration,
    };
  } else {
    const current = metrics[id];
    const renderCount = current.renderCount + 1;
    const totalTime = current.totalTime + actualDuration;
    
    metrics[id] = {
      renderCount,
      totalTime,
      minTime: Math.min(current.minTime, actualDuration),
      maxTime: Math.max(current.maxTime, actualDuration),
      avgTime: totalTime / renderCount,
    };
  }

  // 警告处理
  if (actualDuration > 16) { // 一帧的时间约为16.67ms
    console.warn(
      `[组件性能] 组件渲染缓慢: ${id} 耗时 ${actualDuration.toFixed(2)}ms`
    );
    
    if (actualDuration > 50) {
      reportPerformanceIssue(
        `组件渲染非常缓慢: ${id}`,
        actualDuration
      );
    }
  }
};

/**
 * 组件包装器，用于性能监控
 */
export const withProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  componentId: string
): React.FC<P> => {
  return (props: P) => (
    <Profiler id={componentId} onRender={onRenderCallback}>
      <Component {...props} />
    </Profiler>
  );
};

/**
 * 可以直接使用的Profiler组件
 */
export const PerformanceProfiler: React.FC<PropsWithChildren<{ id: string }>> = ({ 
  children, 
  id 
}) => {
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}; 