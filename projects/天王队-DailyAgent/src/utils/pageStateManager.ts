/**
 * 页面状态管理工具
 * Agent 页面简化版本 - 提供最小化实现
 */

export interface PageState {
  path: string;
  state?: any;
}

/**
 * 保存页面状态
 */
export const savePageState = (): void => {
  // Agent 页面不需要保存页面状态
  // 保持接口兼容性，但不执行任何操作
};

/**
 * 获取保存的页面状态
 */
export const getSavedPageState = (): PageState | null => {
  // Agent 页面不需要恢复页面状态
  return null;
};

/**
 * 清除保存的页面状态
 */
export const clearSavedPageState = (): void => {
  // Agent 页面不需要清除页面状态
};

/**
 * 恢复页面状态
 */
export const restorePageState = (): void => {
  // Agent 页面不需要恢复页面状态
};

/**
 * 判断是否应该保存页面状态
 */
export const shouldSavePageState = (): boolean => {
  // Agent 页面不需要保存页面状态
  return false;
};

