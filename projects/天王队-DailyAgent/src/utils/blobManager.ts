/**
 * Blob URL 生命周期管理器
 * 解决 blob URL 过早释放导致图片预览失效的问题
 */

interface BlobCacheEntry {
  url: string;
  fileId: string;
  fileName: string;
  refCount: number; // 引用计数
  createTime: number;
  lastUsed: number;
}

export class BlobManager {
  private static instance: BlobManager;
  private cache = new Map<string, BlobCacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // 缓存清理配置
  private readonly MAX_CACHE_SIZE = 50; // 最大缓存数量
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000; // 30分钟过期
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟清理一次
  
  private constructor() {
    this.startCleanupTimer();
  }
  
  public static getInstance(): BlobManager {
    if (!BlobManager.instance) {
      BlobManager.instance = new BlobManager();
    }
    return BlobManager.instance;
  }
  
  /**
   * 创建或获取 blob URL
   */
  public createBlobUrl(file: File, fileId: string): string {
    // 检查是否已存在
    const existing = this.cache.get(fileId);
    if (existing) {
      existing.refCount++;
      existing.lastUsed = Date.now();
      return existing.url;
    }
    
    try {
      const blobUrl = URL.createObjectURL(file);
      const now = Date.now();
      
      this.cache.set(fileId, {
        url: blobUrl,
        fileId,
        fileName: file.name,
        refCount: 1,
        createTime: now,
        lastUsed: now
      });
      
      console.log(`BlobManager: 创建 blob URL for ${file.name}:`, blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('创建 blob URL 失败:', error);
      return '';
    }
  }
  
  /**
   * 增加引用计数（当消息使用该 blob URL 时调用）
   */
  public retainBlobUrl(fileId: string): void {
    const entry = this.cache.get(fileId);
    if (entry) {
      entry.refCount++;
      entry.lastUsed = Date.now();
      console.log(`BlobManager: 增加引用 ${fileId}, refCount: ${entry.refCount}`);
    }
  }
  
  /**
   * 减少引用计数（当不再需要该 blob URL 时调用）
   */
  public releaseBlobUrl(fileId: string): void {
    const entry = this.cache.get(fileId);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
      console.log(`BlobManager: 减少引用 ${fileId}, refCount: ${entry.refCount}`);
      
      // 如果引用计数为0，标记为可清理（但不立即清理）
      if (entry.refCount === 0) {
        entry.lastUsed = Date.now();
      }
    }
  }
  
  /**
   * 获取 blob URL
   */
  public getBlobUrl(fileId: string): string | null {
    const entry = this.cache.get(fileId);
    if (entry) {
      entry.lastUsed = Date.now();
      return entry.url;
    }
    return null;
  }
  
  /**
   * 强制释放特定的 blob URL
   */
  public revokeBlobUrl(fileId: string): void {
    const entry = this.cache.get(fileId);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.cache.delete(fileId);
      console.log(`BlobManager: 强制释放 blob URL ${fileId}`);
    }
  }
  
  /**
   * 启动定时清理
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }
  
  /**
   * 执行清理操作
   */
  private performCleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    // 查找需要清理的项目
    for (const [fileId, entry] of this.cache) {
      const shouldCleanup = 
        // 引用计数为0且超过一定时间未使用
        (entry.refCount === 0 && now - entry.lastUsed > 60 * 1000) ||
        // 或者创建时间过久
        (now - entry.createTime > this.MAX_CACHE_AGE);
      
      if (shouldCleanup) {
        toDelete.push(fileId);
      }
    }
    
    // 如果缓存过多，清理最老的项目
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
      
      const excess = this.cache.size - this.MAX_CACHE_SIZE;
      for (let i = 0; i < excess; i++) {
        const [fileId] = sortedEntries[i];
        if (!toDelete.includes(fileId)) {
          toDelete.push(fileId);
        }
      }
    }
    
    // 执行清理
    toDelete.forEach(fileId => {
      const entry = this.cache.get(fileId);
      if (entry) {
        URL.revokeObjectURL(entry.url);
        this.cache.delete(fileId);
        console.log(`BlobManager: 自动清理 blob URL ${fileId}`);
      }
    });
    
    if (toDelete.length > 0) {
      console.log(`BlobManager: 清理了 ${toDelete.length} 个 blob URL，剩余 ${this.cache.size} 个`);
    }
  }
  
  /**
   * 获取缓存状态信息
   */
  public getCacheInfo() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([fileId, entry]) => ({
        fileId,
        fileName: entry.fileName,
        refCount: entry.refCount,
        age: Date.now() - entry.createTime,
        unused: Date.now() - entry.lastUsed
      }))
    };
  }
  
  /**
   * 清理所有缓存
   */
  public clearAll(): void {
    for (const [, entry] of this.cache) {
      URL.revokeObjectURL(entry.url);
    }
    this.cache.clear();
    console.log('BlobManager: 清理了所有 blob URL');
  }
  
  /**
   * 销毁管理器
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
  }
}

export default BlobManager.getInstance();
