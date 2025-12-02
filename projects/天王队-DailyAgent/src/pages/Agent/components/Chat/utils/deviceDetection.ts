// 设备检测工具函数

/**
 * 检测是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 检测是否为安卓设备
 */
export const isAndroidDevice = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * 检测是否为iOS设备
 */
export const isIOSDevice = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}; 