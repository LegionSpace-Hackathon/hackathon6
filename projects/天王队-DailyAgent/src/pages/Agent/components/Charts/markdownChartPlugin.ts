/**
 * Markdown图表插件
 * 用于在Markdown中渲染图表
 */

interface ChartConfig {
  type: string;
  data?: any;
  options?: any;
  [key: string]: any;
}

interface ChartElement extends HTMLElement {
  chartConfig?: ChartConfig;
}

/**
 * 解析Markdown中的图表配置
 * @param content Markdown内容
 * @returns 带有图表配置的处理后内容
 */
export const parseChartBlocks = (content: string): string => {
  // 匹配 ```chart 代码块
  const chartRegex = /```chart\s*([\s\S]*?)```/g;
  
  return content.replace(chartRegex, (match, chartContent) => {
    try {
      // 尝试解析JSON配置
      const config = JSON.parse(chartContent.trim());
      const chartId = `chart-${Math.random().toString(36).substring(2, 9)}`;
      
      // 创建图表占位符
      return `<div class="markdown-chart" id="${chartId}" data-chart-config="${encodeURIComponent(JSON.stringify(config))}"></div>`;
    } catch (error) {
      console.error('解析图表配置失败:', error);
      return `<pre><code>图表配置解析错误: ${error instanceof Error ? error.message : String(error)}</code></pre>`;
    }
  });
};

/**
 * 初始化页面中的图表
 * 在Markdown渲染完成后调用
 */
export const initCharts = (container: HTMLElement): void => {
  // 查找所有图表占位符
  const chartElements = container.querySelectorAll('.markdown-chart') as NodeListOf<ChartElement>;
  
  chartElements.forEach((element) => {
    try {
      // 获取图表配置
      const configStr = element.getAttribute('data-chart-config');
      if (!configStr) return;
      
      const config = JSON.parse(decodeURIComponent(configStr));
      element.chartConfig = config;
      
      // 添加图表初始化标记，用于异步加载图表
      element.setAttribute('data-chart-init', 'pending');
    } catch (error) {
      console.error('初始化图表失败:', error);
      element.innerHTML = `<div class="chart-error">图表初始化失败: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
  });
};

/**
 * 支持的图表类型
 */
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  SCATTER = 'scatter',
  RADAR = 'radar',
  HEATMAP = 'heatmap',
  TREE = 'tree',
  SUNBURST = 'sunburst',
}

/**
 * 获取图表配置模板
 * @param type 图表类型
 * @returns 图表配置模板
 */
export const getChartTemplate = (type: ChartType): ChartConfig => {
  switch (type) {
    case ChartType.BAR:
      return {
        type: 'bar',
        title: {
          text: '柱状图示例'
        },
        xAxis: {
          data: ['类别1', '类别2', '类别3', '类别4', '类别5']
        },
        yAxis: {},
        series: [
          {
            name: '数据系列1',
            type: 'bar',
            data: [120, 200, 150, 80, 70]
          }
        ]
      };
      
    case ChartType.LINE:
      return {
        type: 'line',
        title: {
          text: '折线图示例'
        },
        xAxis: {
          data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {},
        series: [
          {
            name: '数据系列1',
            type: 'line',
            data: [120, 132, 101, 134, 90, 230]
          }
        ]
      };
      
    case ChartType.PIE:
      return {
        type: 'pie',
        title: {
          text: '饼图示例'
        },
        series: [
          {
            name: '访问来源',
            type: 'pie',
            radius: '55%',
            data: [
              { value: 335, name: '直接访问' },
              { value: 310, name: '邮件营销' },
              { value: 234, name: '联盟广告' },
              { value: 135, name: '视频广告' },
              { value: 1548, name: '搜索引擎' }
            ]
          }
        ]
      };
      
    default:
      return {
        type: 'bar',
        title: {
          text: '默认图表'
        }
      };
  }
}; 