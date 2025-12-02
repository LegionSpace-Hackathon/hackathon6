/**
 * 本地存储管理工具
 * 提供配额检查、自动清理等功能
 */

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export class StorageManager {
  private static instance: StorageManager;
  
  private constructor() {}
  
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }
  
  /**
   * 获取存储使用情况
   */
  public getStorageInfo(): StorageInfo {
    let used = 0;
    let total = 5 * 1024 * 1024; // 默认5MB配额
    
    try {
      // 计算已使用空间
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // 尝试获取实际配额（如果浏览器支持）
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          if (estimate.quota) {
            total = estimate.quota;
          }
        });
      }
    } catch (error) {
      console.error('获取存储信息失败:', error);
    }
    
    return {
      used,
      available: total - used,
      total,
      percentage: (used / total) * 100
    };
  }
  
  /**
   * 检查是否需要清理存储
   */
  public needsCleanup(): boolean {
    const info = this.getStorageInfo();
    return info.percentage > 80; // 超过80%时需要清理
  }
  
  /**
   * 安全地设置localStorage项目
   */
  public safeSetItem(key: string, value: string): boolean {
    try {
      // 检查数据大小
      const dataSize = value.length + key.length;
      const info = this.getStorageInfo();
      
      if (info.available < dataSize) {
        console.warn(`存储空间不足，需要${dataSize}字节，可用${info.available}字节`);
        this.performCleanup();
        
        // 再次检查
        const newInfo = this.getStorageInfo();
        if (newInfo.available < dataSize) {
          console.error('清理后仍然空间不足');
          return false;
        }
      }
      
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage配额超限，执行清理');
        this.performCleanup();
        
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (secondError) {
          console.error('清理后仍无法存储:', secondError);
          return false;
        }
      } else {
        console.error('存储失败:', error);
        return false;
      }
    }
  }
  
  /**
   * 执行存储清理
   */
  public performCleanup(): void {
    console.log('开始执行存储清理...');
    
    try {
      // 清理策略：优先清理大的数据项
      const items: Array<{key: string, size: number}> = [];
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          items.push({
            key,
            size: localStorage[key].length
          });
        }
      }
      
      // 按大小排序
      items.sort((a, b) => b.size - a.size);
      
      // 清理大的数据项，但保留重要配置
      const importantKeys = ['theme', 'language', 'user_preferences'];
      let clearedSize = 0;
      
      for (const item of items) {
        if (importantKeys.includes(item.key)) {
          continue;
        }
        
        // 如果是消息数据，尝试压缩而不是删除
        if (item.key.includes('messages')) {
          this.compressMessages(item.key);
        } else if (item.size > 100 * 1024) { // 大于100KB的项目直接删除
          localStorage.removeItem(item.key);
          clearedSize += item.size;
          console.log(`清理了 ${item.key}，释放 ${item.size} 字节`);
        }
        
        // 如果已经清理了足够的空间，停止清理
        if (clearedSize > 1024 * 1024) { // 清理1MB后停止
          break;
        }
      }
      
      console.log(`存储清理完成，释放了 ${clearedSize} 字节`);
    } catch (error) {
      console.error('存储清理失败:', error);
    }
  }
  
  /**
   * 压缩消息数据
   */
  private compressMessages(key: string): void {
    try {
      const data = localStorage.getItem(key);
      if (!data) return;
      
      const messages = JSON.parse(data);
      if (Array.isArray(messages)) {
        // 只保留最近的消息，移除大文件数据
        const compressedMessages = messages.slice(-30).map((msg: any) => ({
          ...msg,
          files: msg.files?.map((file: any) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url
            // 移除previewUrl等大数据字段
          }))
        }));
        
        localStorage.setItem(key, JSON.stringify(compressedMessages));
        console.log(`压缩了消息数据 ${key}`);
      }
    } catch (error) {
      console.error(`压缩消息数据失败 ${key}:`, error);
      // 如果压缩失败，直接删除
      localStorage.removeItem(key);
    }
  }
  
  /**
   * 清理指定模式的键
   */
  public cleanupByPattern(pattern: RegExp): void {
    const keysToRemove: string[] = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && pattern.test(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`清理了匹配模式的键: ${key}`);
    });
  }
}

// ============ 安全存储类（带自动降级） ============
/**
 * 安全的存储类，在localStorage不可用时自动降级到内存存储
 * 提供完全相同的API接口，但在存储失败时不会抛出异常
 */
export class SafeStorage {
  private fallbackStorage = new Map<string, string>();
  private isLocalStorageAvailable = true;

  constructor() {
    // 检查localStorage是否可用
    this.checkLocalStorageAvailability();
  }

  /**
   * 检查localStorage是否可用
   */
  private checkLocalStorageAvailability(): void {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch {
      this.isLocalStorageAvailable = false;
      console.warn('⚠️ localStorage不可用，已降级到内存存储');
    }
  }

  /**
   * 设置存储项
   */
  public setItem(key: string, value: string): boolean {
    // 首先尝试localStorage
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        // localStorage失败，标记为不可用
        if (error instanceof DOMException && 
            (error.name === 'QuotaExceededError' || error.name === 'SecurityError')) {
          this.isLocalStorageAvailable = false;
          console.warn('localStorage操作失败，已降级到内存存储:', error.name);
        }
      }
    }

    // 降级到内存存储
    this.fallbackStorage.set(key, value);
    return false; // 返回false表示使用了降级存储
  }

  /**
   * 获取存储项
   */
  public getItem(key: string): string | null {
    // 优先从localStorage获取
    if (this.isLocalStorageAvailable) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
      } catch (error) {
        console.warn('从localStorage读取失败:', error);
        this.isLocalStorageAvailable = false;
      }
    }

    // 从内存存储获取
    return this.fallbackStorage.get(key) || null;
  }

  /**
   * 删除存储项
   */
  public removeItem(key: string): void {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('从localStorage删除失败:', error);
      }
    }

    this.fallbackStorage.delete(key);
  }

  /**
   * 清空所有存储
   */
  public clear(): void {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('清空localStorage失败:', error);
      }
    }

    this.fallbackStorage.clear();
  }

  /**
   * 获取存储项数量
   */
  public get length(): number {
    if (this.isLocalStorageAvailable) {
      try {
        return localStorage.length;
      } catch {
        // 忽略错误
      }
    }

    return this.fallbackStorage.size;
  }

  /**
   * 获取指定索引的键名
   */
  public key(index: number): string | null {
    if (this.isLocalStorageAvailable) {
      try {
        return localStorage.key(index);
      } catch {
        // 忽略错误
      }
    }

    const keys = Array.from(this.fallbackStorage.keys());
    return keys[index] || null;
  }

  /**
   * 检查是否正在使用降级存储
   */
  public isUsingFallback(): boolean {
    return !this.isLocalStorageAvailable;
  }

  /**
   * 尝试恢复localStorage
   */
  public tryRestore(): boolean {
    this.checkLocalStorageAvailability();
    
    // 如果恢复成功，同步内存数据到localStorage
    if (this.isLocalStorageAvailable && this.fallbackStorage.size > 0) {
      console.log('尝试将内存数据同步到localStorage...');
      let syncCount = 0;
      
      for (const [key, value] of this.fallbackStorage.entries()) {
        try {
          localStorage.setItem(key, value);
          syncCount++;
        } catch (error) {
          console.warn(`同步失败: ${key}`, error);
          this.isLocalStorageAvailable = false;
          break;
        }
      }
      
      if (syncCount > 0) {
        console.log(`✅ 已同步 ${syncCount} 个数据项到localStorage`);
      }
    }
    
    return this.isLocalStorageAvailable;
  }
}

// 导出单例实例
export const safeStorage = new SafeStorage();

export default StorageManager.getInstance();
