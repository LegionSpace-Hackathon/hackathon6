import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './DynamicChart.scss';

interface DynamicChartProps {
  config: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
  width?: number | string;
}

/**
 * 动态图表组件
 * 根据传入的配置渲染ECharts图表
 */
const DynamicChart: React.FC<DynamicChartProps> = ({
  config,
  className = '',
  style,
  height = '300px',
  width = '100%'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 如果已存在实例且未销毁，先销毁
    if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }

    // 初始化图表实例
    let chartInstance = chartInstanceRef.current;
    if (!chartInstance) {
      try {
        chartInstance = echarts.init(chartRef.current);
        chartInstanceRef.current = chartInstance;
      } catch (error) {
        console.error('DynamicChart初始化失败:', error);
        return;
      }
    }

    // 应用图表配置
    try {
      chartInstance.setOption(config, true);
    } catch (error) {
      console.error('设置图表配置失败:', error);
    }

    // 响应窗口大小变化
    const handleResize = () => {
      if (chartInstance && !chartInstance.isDisposed()) {
        chartInstance.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // 延迟销毁图表实例，防止在动画过程中销毁导致的错误
      setTimeout(() => {
        if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        }
      }, 0);
    };
  }, [config]);

  return (
    <div 
      ref={chartRef}
      className={`dynamic-chart ${className}`}
      style={{ 
        height, 
        width,
        ...style 
      }}
    />
  );
};

export default DynamicChart; 