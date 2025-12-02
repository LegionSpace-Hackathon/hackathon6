/**
 * 缓存管理器
 * 用于处理版本更新时的缓存清理
 */

interface CacheManagerOptions {
  version?: string;
  enableAutoClean?: boolean;
  cleanInterval?: number;
}

class CacheManager {
  private version: string;
  private enableAutoClean: boolean;
  private cleanInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(options: CacheManagerOptions = {}) {
    this.version = options.version || import.meta.env.VITE_APP_VERSION || '1.0.0';
    this.enableAutoClean = options.enableAutoClean ?? true;
    this.cleanInterval = options.cleanInterval || 30000; // 30秒检查一次
  }

  /**
   * 初始化缓存管理器
   */
  init() {
    this.checkVersion();
    
    if (this.enableAutoClean) {
      this.startAutoClean();
    }
  }

  /**
   * 检查版本并清理缓存
   */
  checkVersion() {
    try {
      const storedVersion = localStorage.getItem('app_version');
      
      if (storedVersion && storedVersion !== this.version) {
        console.log(`检测到版本更新: ${storedVersion} -> ${this.version}`);
        this.cleanAllCaches();
        localStorage.setItem('app_version', this.version);
      } else if (!storedVersion) {
        localStorage.setItem('app_version', this.version);
      }
    } catch (error) {
      console.error('版本检查失败:', error);
    }
  }

  /**
   * 清理所有缓存
   */
  cleanAllCaches() {
    console.log('开始清理缓存...');
    
    // 清理react-activation缓存
    this.cleanReactActivationCache();
    
    // 清理sessionStorage中的缓存标记
    this.cleanSessionStorageCache();
    
    // 清理localStorage中的页面缓存
    this.cleanLocalStorageCache();
    
    console.log('缓存清理完成');
  }

  /**
   * 清理react-activation缓存
   */
  private cleanReactActivationCache() {
    try {
      // 清理全局缓存
      if ((window as any).__REACT_ACTIVATION_CACHE__) {
        (window as any).__REACT_ACTIVATION_CACHE__.clear();
      }
      
      // 清理页面缓存
      const aliveScopes = document.querySelectorAll('[data-alive-scope]');
      aliveScopes.forEach(scope => {
        if ((scope as any).__REACT_ACTIVATION_CACHE__) {
          (scope as any).__REACT_ACTIVATION_CACHE__.clear();
        }
      });
    } catch (error) {
      console.error('清理react-activation缓存失败:', error);
    }
  }

  /**
   * 清理sessionStorage中的缓存标记
   */
  private cleanSessionStorageCache() {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('header_loaded_') || 
          key.includes('animated_') ||
          key.includes('scroll_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log(`清理了 ${keysToRemove.length} 个sessionStorage缓存项`);
    } catch (error) {
      console.error('清理sessionStorage缓存失败:', error);
    }
  }

  /**
   * 清理localStorage中的页面缓存
   */
  private cleanLocalStorageCache() {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('page_cache_') ||
          key.includes('scroll_position_') ||
          key.includes('component_state_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`清理了 ${keysToRemove.length} 个localStorage缓存项`);
    } catch (error) {
      console.error('清理localStorage缓存失败:', error);
    }
  }

  /**
   * 开始自动清理
   */
  private startAutoClean() {
    this.intervalId = setInterval(() => {
      this.checkVersion();
    }, this.cleanInterval);
  }

  /**
   * 停止自动清理
   */
  stopAutoClean() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 手动清理缓存
   */
  manualClean() {
    this.cleanAllCaches();
  }

  /**
   * 获取当前版本
   */
  getVersion() {
    return this.version;
  }

  /**
   * 检查是否需要清理缓存
   */
  needsClean() {
    const storedVersion = localStorage.getItem('app_version');
    return storedVersion && storedVersion !== this.version;
  }
}

// 创建全局实例
const cacheManager = new CacheManager({
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableAutoClean: true,
  cleanInterval: 30000
});

export default cacheManager;
export { CacheManager };
