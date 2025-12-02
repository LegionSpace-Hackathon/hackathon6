import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './Charts.scss';

interface EChartsRendererProps {
  config: Record<string, any>;
  id: string;
  className?: string;
  height?: string | number;
  width?: string | number;
}

/**
 * ECharts图表渲染组件
 * 用于在消息气泡中渲染ECharts图表
 */
const EChartsRenderer: React.FC<EChartsRendererProps> = ({
  config,
  id,
  className = '',
  height = '400px',
  width = '100%'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    // 如果已存在实例且未销毁，先销毁
    if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }

    // 初始化图表实例
    if (!chartInstanceRef.current) {
      try {
        chartInstanceRef.current = echarts.init(chartRef.current);
      } catch (error) {
        console.error('ECharts初始化失败:', error);
        return;
      }
    }

    // 应用配置
    try {
      chartInstanceRef.current.setOption(config);
    } catch (error) {
      console.error('ECharts配置应用失败:', error);
    }

    // 响应窗口大小变化
    const handleResize = () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [config]);

  // 移动端触摸交互优化
  useEffect(() => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobileDevice && chartInstanceRef.current) {
      // 增强移动端交互体验
      chartInstanceRef.current.setOption({
        tooltip: {
          triggerOn: 'click', // 在移动端使用点击触发tooltip
          confine: true, // tooltip限制在图表区域内
          enterable: true // 允许鼠标进入tooltip
        },
        // 可以根据需要添加更多移动端优化配置
      }, false); // 不替换之前的配置，而是合并
    }
  }, []);

  return (
    <div 
      className={`echarts-container ${className}`}
      id={id}
      ref={chartRef}
      style={{
        width: width,
        height: height,
        margin: '10px 0'
      }}
    />
  );
};

export default EChartsRenderer; 