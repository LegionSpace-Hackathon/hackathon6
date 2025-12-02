import { initWebVitals, getWebVitals } from './performance/webVitals';
import { 
  startMark, 
  endMark, 
  measureFn, 
  withPerformance, 
  getPerformanceEntries, 
  resetPerformanceEntries 
} from './performance/performanceLogger';
import { 
  withProfiler, 
  PerformanceProfiler, 
  getRenderMetrics 
} from './performance/reactProfiler';
import { useRouteMonitor } from './routeMonitor';
import { 
  createPerformanceMiddleware, 
  monitorStateSize, 
  monitorUpdateFrequency 
} from './reduxMonitor';
import { 
  reportPerformanceIssue, 
  collectPerformanceData 
} from './reporting/reportService';

/**
 * 初始化所有性能监控
 */
export const initPerformanceMonitoring = () => {
  // 初始化Web Vitals
  initWebVitals();
  
  console.info('[性能监控] 性能监控已初始化');
};

// 导出所有性能监控工具
export {
  // Web Vitals
  initWebVitals,
  getWebVitals,
  
  // 性能记录
  startMark,
  endMark,
  measureFn,
  withPerformance,
  getPerformanceEntries,
  resetPerformanceEntries,
  
  // React组件性能
  withProfiler,
  PerformanceProfiler,
  getRenderMetrics,
  
  // 路由监控
  useRouteMonitor,
  
  // Redux监控
  createPerformanceMiddleware,
  monitorStateSize,
  monitorUpdateFrequency,
  
  // 上报服务
  reportPerformanceIssue,
  collectPerformanceData
}; 