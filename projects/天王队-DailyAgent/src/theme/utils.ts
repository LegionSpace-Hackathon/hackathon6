import type { ThemeMode } from '../stores/slices/themeSlice';

const THEME_MODE_KEY = 'space-front-theme-mode';

/**
 * 检测系统主题偏好
 */
export const getSystemThemePreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  
  // 优先使用 prefers-color-scheme 媒体查询
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

/**
 * 获取实际应用的主题（如果是 auto，则返回系统偏好）
 */
export const getEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'auto') {
    return getSystemThemePreference();
  }
  return mode;
};

/**
 * 从本地存储获取主题模式，如果没有则返回 'auto'（跟随系统）
 */
export const getThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'auto';
  }
  
  const saved = localStorage.getItem(THEME_MODE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'auto') {
    return saved as ThemeMode;
  }
  
  // 默认返回 'auto'，跟随系统主题
  return 'auto';
};

/**
 * 设置主题模式
 */
export const setThemeMode = (mode: ThemeMode): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // 保存到localStorage
  localStorage.setItem(THEME_MODE_KEY, mode);
  
  // 获取实际应用的主题
  const effectiveTheme = getEffectiveTheme(mode);
  
  // 应用到文档根元素
  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
  
  // 更新meta主题颜色
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff');
  }
};

/**
 * 监听系统主题变化
 */
export const watchSystemThemeChange = (callback: (theme: 'light' | 'dark') => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // 处理函数
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  // 监听变化
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  } else {
    // 兼容旧版浏览器
    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }
};

/**
 * 初始化主题
 * 注意：系统主题变化的监听在 App.tsx 的 useEffect 中处理
 */
export const initTheme = (): ThemeMode => {
  const mode = getThemeMode();
  setThemeMode(mode);
  return mode;
}; 