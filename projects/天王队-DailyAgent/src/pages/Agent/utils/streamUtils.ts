/**
 * 流式数据处理工具
 */

/**
 * 解析服务器发送的事件数据
 * @param data 事件数据
 * @returns 解析后的数据对象
 */
export const parseEventData = (data: string): any => {
  if (data === '[DONE]') {
    return { done: true };
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('解析事件数据失败:', error);
    return { error: '无效数据格式' };
  }
};

/**
 * 处理流式文本块
 * @param text 文本块
 * @returns 处理后的文本
 */
export const processTextChunk = (text: string): string => {
  // 此处可以添加额外的文本处理逻辑，如替换特殊字符等
  return text;
};

/**
 * 检测代码块
 * @param text 文本
 * @returns 是否包含代码块
 */
export const hasCodeBlock = (text: string): boolean => {
  return /```[\s\S]*?```/.test(text);
};

/**
 * 从流式数据中提取代码块
 * @param text 文本
 * @returns 代码块数组
 */
export const extractCodeBlocks = (text: string): Array<{ language: string; code: string }> => {
  const codeBlockRegex = /```(\w*)([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return blocks;
};

/**
 * 提取Markdown表格
 * @param text 文本
 * @returns 表格数组
 */
export const extractTables = (text: string): Array<string> => {
  // 匹配Markdown表格
  const tableRegex = /(\|[^\n]+\|\r?\n)((?:\|:?[-]+:?)+\|)(\n(?:\|[^\n]+\|\r?\n?)*)/g;
  const tables: Array<string> = [];
  let match;

  while ((match = tableRegex.exec(text)) !== null) {
    tables.push(match[0]);
  }

  return tables;
};

/**
 * 提取图表配置
 * @param text 文本
 * @returns 图表配置数组
 */
export const extractChartConfigs = (text: string): Array<Record<string, any>> => {
  // 查找特定格式的JSON代码块，这些代码块包含图表配置
  const chartConfigRegex = /```chart\s*([\s\S]*?)```/g;
  const configs: Array<Record<string, any>> = [];
  let match;

  while ((match = chartConfigRegex.exec(text)) !== null) {
    try {
      const config = JSON.parse(match[1].trim());
      configs.push(config);
    } catch (error) {
      console.error('解析图表配置失败:', error);
    }
  }

  return configs;
}; 