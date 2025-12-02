import React from 'react';

// 正则表达式用于匹配 ```echarts ... ``` 格式的图表配置
const ECHARTS_REGEX = /```echarts\n([\s\S]*?)```/g;

// 存储所有图表配置的映射，键为ID，值为配置
const chartsConfigsMap: Record<string, any> = {};

/**
 * 检测当前是否为H5环境
 * @returns 是否为H5环境
 */
const isH5Environment = (): boolean => {
  // 检查是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // 检查屏幕宽度是否小于特定值（典型的移动屏幕宽度）
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobile || isSmallScreen;
};

/**
 * 从Markdown内容中提取ECharts配置
 * @param content Markdown内容
 * @returns ECharts配置数组
 */
export const extractEchartsConfigs = (content: string): Array<Record<string, any>> => {
  const configs: Array<Record<string, any>> = [];
  let match;
  
  // 重置正则表达式的lastIndex
  ECHARTS_REGEX.lastIndex = 0;
  
  // 清空之前的配置映射
  Object.keys(chartsConfigsMap).forEach(key => delete chartsConfigsMap[key]);
  
  while ((match = ECHARTS_REGEX.exec(content)) !== null) {
    try {
      const configStr = match[1].trim();
      const config = JSON.parse(configStr);
      // 创建固定格式的ID，但使用递增数字确保唯一性
      const id = `echarts-${Date.now()}-${configs.length}`;
      
      // 存储配置到映射中
      chartsConfigsMap[id] = config;
      
      configs.push({ id, config });
      
      // 打印日志，帮助调试
      console.log(`提取到图表配置 ID: ${id}`, config);
    } catch (error) {
      console.error('解析ECharts配置失败:', error);
    }
  }
  
  return configs;
};

/**
 * 处理Markdown内容，替换ECharts代码块为占位符
 * @param content Markdown内容
 * @returns 处理后的内容和图表配置映射
 */
export const processEchartsBlocks = (content: string): { content: string, chartIds: string[] } => {
  // 先提取配置，确保ID一致性
  const configs = extractEchartsConfigs(content);
  const chartIds: string[] = configs.map(config => config.id);
  
  // 重置正则表达式的lastIndex
  ECHARTS_REGEX.lastIndex = 0;
  
  let processedContent = content;
  let match;
  let index = 0;
  
  // 替换所有匹配项
  while ((match = ECHARTS_REGEX.exec(content)) !== null) {
    if (index < configs.length) {
      const id = configs[index].id;
      
      // 使用特殊格式的标记，可以在DOM中更容易识别
      // 用<div>标签包装，确保它在Markdown中被正确解析为HTML
      const placeholder = `<div><div id="echarts-placeholder-${id}" class="echarts-placeholder" data-echarts-id="${id}">Loading chart...</div></div>`;
      
      processedContent = processedContent.replace(match[0], placeholder);
      
      // 打印日志，帮助调试
      console.log(`创建图表占位符 ID: ${id}`);
      
      index++;
    }
  }
  
  return { content: processedContent, chartIds };
};

/**
 * 获取图表配置
 * @param id 图表ID
 * @returns 图表配置
 */
export const getChartConfig = (id: string): any => {
  const config = chartsConfigsMap[id];
  // 打印日志，帮助调试
  console.log(`获取图表配置 ID: ${id}`, config);
  return config;
};

/**
 * 调整图表配置适配H5环境
 * @param config 原始图表配置
 * @returns 调整后的图表配置
 */
const adjustChartConfigForH5 = (config: any): any => {
  // 创建配置的深拷贝，避免修改原始配置
  const adjustedConfig = JSON.parse(JSON.stringify(config));
  
  // 在H5环境下隐藏图例
  if (isH5Environment()) {
    console.log('H5环境检测到，隐藏图例');
    // 如果没有legend配置，添加一个空的配置
    if (!adjustedConfig.legend) {
      adjustedConfig.legend = {};
    }
    // 设置图例为不显示
    adjustedConfig.legend.show = false;
    
    // 可能需要调整其他元素以适应没有图例的布局
    if (adjustedConfig.grid) {
      // 调整图表网格，使其占据更多空间
      adjustedConfig.grid = {
        ...adjustedConfig.grid,
        top: '10%',
        right: '5%',
        bottom: '10%',
        left: '5%',
        containLabel: true
      };
    } else {
      adjustedConfig.grid = {
        top: '10%',
        right: '5%',
        bottom: '10%',
        left: '5%',
        containLabel: true
      };
    }
  }
  
  return adjustedConfig;
};

// 全局图表实例管理
const chartInstances = new Map<string, any>();

/**
 * 渲染DOM中所有ECharts占位符
 * 此函数应在Markdown内容完全渲染后调用
 * @param container 包含占位符的容器元素
 * @param echarts echarts库实例
 */
export const renderEchartsPlaceholders = (container: HTMLElement, echarts: any): void => {
  if (!container || !echarts) return;
  
  console.log('renderEchartsPlaceholders: 开始渲染图表');
  
  // 查找所有占位符
  const placeholders = container.querySelectorAll('.echarts-placeholder');
  console.log(`找到${placeholders.length}个ECharts占位符`);
  
  placeholders.forEach((placeholder) => {
    const chartId = placeholder.getAttribute('data-echarts-id');
    if (!chartId) return;
    
    // 检查是否已经存在实例，如果存在则先销毁
    if (chartInstances.has(chartId)) {
      const existingChart = chartInstances.get(chartId);
      if (existingChart && !existingChart.isDisposed()) {
        existingChart.dispose();
      }
      chartInstances.delete(chartId);
    }
    
    const config = getChartConfig(chartId);
    if (!config) return;
    
    try {
      // 创建图表容器
      const chartContainer = document.createElement('div');
      chartContainer.style.width = '100%';
      chartContainer.style.height = '400px';
      chartContainer.style.margin = '16px 0';
      chartContainer.className = 'echarts-container';
      chartContainer.id = chartId;
      
      // 替换占位符
      placeholder.parentNode?.replaceChild(chartContainer, placeholder);
      
      // 延迟初始化ECharts以确保容器准备好了
      setTimeout(() => {
        try {
          // 检查容器是否仍然存在
          if (!document.getElementById(chartId)) {
            console.warn(`图表容器 ${chartId} 已被移除，跳过初始化`);
            return;
          }
          
          const chart = echarts.init(chartContainer);
          
          // 存储实例引用
          chartInstances.set(chartId, chart);
          
          // 根据环境调整配置
          const adjustedConfig = adjustChartConfigForH5(config);
          
          chart.setOption(adjustedConfig);
          console.log(`成功渲染图表: ${chartId}`, isH5Environment() ? '(H5环境，已隐藏图例)' : '');
        } catch (err) {
          console.error(`初始化图表失败: ${chartId}`, err);
        }
      }, 100);
    } catch (err) {
      console.error(`创建图表容器失败: ${chartId}`, err);
    }
  });
};

/**
 * 清理所有图表实例
 */
export const disposeAllCharts = (): void => {
  chartInstances.forEach((chart, chartId) => {
    try {
      if (chart && !chart.isDisposed()) {
        chart.dispose();
        console.log(`已清理图表实例: ${chartId}`);
      }
    } catch (err) {
      console.error(`清理图表实例失败: ${chartId}`, err);
    }
  });
  chartInstances.clear();
};

/**
 * 清理指定容器内的图表实例
 */
export const disposeChartsInContainer = (container: HTMLElement): void => {
  const chartContainers = container.querySelectorAll('.echarts-container');
  chartContainers.forEach((container) => {
    const chartId = container.id;
    if (chartId && chartInstances.has(chartId)) {
      const chart = chartInstances.get(chartId);
      if (chart && !chart.isDisposed()) {
        chart.dispose();
        chartInstances.delete(chartId);
        console.log(`已清理容器内图表实例: ${chartId}`);
      }
    }
  });
};

/**
 * ECharts插件配置
 * 用于在Markdown插件中支持ECharts图表
 */
export const echartsPlugin = {
  type: 'custom' as const,
  id: 'echarts-plugin',
  rehypePlugin: null,
  remarkPlugin: null,
  components: {
    // 这里为空，因为我们使用单独的EChartsRenderer组件
  }
}; 