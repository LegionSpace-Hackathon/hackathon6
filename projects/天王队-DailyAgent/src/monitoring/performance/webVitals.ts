import { Metric, onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { reportPerformanceIssue } from '../reporting/reportService';

// 性能指标收集工具
const metrics: Record<string, number> = {};

/**
 * 初始化Web Vitals监控
 * 基于Google Web Vitals v5.0.3版本
 */
export const initWebVitals = () => {
  // 监控CLS (Cumulative Layout Shift) - 累积布局偏移
  onCLS((metric) => {
    handleMetric(metric);
    if (metric.value > 0.1) {
      reportPerformanceIssue('CLS超过0.1 (布局偏移)', metric.value);
    }
  });

  // 监控INP (Interaction to Next Paint) - 交互到下一帧绘制时间
  // 注意：在web-vitals v5中，INP替代了FID作为核心指标
  onINP((metric) => {
    handleMetric(metric);
    if (metric.value > 200) {
      reportPerformanceIssue('INP超过200ms (交互响应延迟)', metric.value);
    }
  });

  // 监控FCP (First Contentful Paint) - 首次内容绘制
  onFCP((metric) => {
    handleMetric(metric);
    if (metric.value > 1800) {
      reportPerformanceIssue('FCP超过1.8秒 (首次内容绘制延迟)', metric.value);
    }
  });

  // 监控LCP (Largest Contentful Paint) - 最大内容绘制
  onLCP((metric) => {
    handleMetric(metric);
    if (metric.value > 2500) {
      reportPerformanceIssue('LCP超过2.5秒 (最大内容绘制延迟)', metric.value);
    }
  });

  // 监控TTFB (Time to First Byte) - 首字节时间
  onTTFB((metric) => {
    handleMetric(metric);
    if (metric.value > 800) {
      reportPerformanceIssue('TTFB超过800ms (服务器响应延迟)', metric.value);
    }
  });

  console.log('[性能监控] Web Vitals监控已初始化 (v5.0.3)');
};

/**
 * 处理并记录指标数据
 */
const handleMetric = (metric: Metric) => {
  metrics[metric.name] = metric.value;
  console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value * 100) / 100}`);
};

/**
 * 获取当前收集的所有Web Vitals指标
 */
export const getWebVitals = () => ({ ...metrics });
