// 混合存储管理器 - 智能选择localStorage或IndexedDB

import { 
  initIndexedDB, 
  storeFile, 
  getFile, 
  deleteFile, 
  storeRoleResources, 
  getIndexedDBStats,
  migrateFromLocalStorage,
  dbManager
} from './indexedDBStorage';

export type StorageType = 'localStorage' | 'indexedDB' | 'auto';

export interface StorageConfig {
  type: StorageType;
  localStorageLimit: number; // localStorage大小限制（字节）
  autoSwitchThreshold: number; // 自动切换阈值（字节）
  enableCompression: boolean; // 是否启用压缩
  enableChunking: boolean; // 是否启用分片存储
}

// 默认配置 - 降低阈值以更早切换到IndexedDB
const DEFAULT_CONFIG: StorageConfig = {
  type: 'auto',
  localStorageLimit: 2 * 1024 * 1024, // 降低到2MB
  autoSwitchThreshold: 1 * 1024 * 1024, // 降低到1MB，更早切换到IndexedDB
  enableCompression: true,
  enableChunking: true
};

class HybridStorageManager {
  private config: StorageConfig;
  private currentStorage: 'localStorage' | 'indexedDB' | null = null;
  private isInitialized = false;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化存储管理器
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化IndexedDB
      await initIndexedDB();
      
      // 根据配置选择存储类型
      if (this.config.type === 'auto') {
        this.currentStorage = await this.detectBestStorage();
      } else {
        this.currentStorage = this.config.type;
      }

      this.isInitialized = true;
      console.log(`混合存储管理器初始化完成，使用: ${this.currentStorage}`);
    } catch (error) {
      console.error('混合存储管理器初始化失败:', error);
      // 降级到localStorage
      this.currentStorage = 'localStorage';
      this.isInitialized = true;
    }
  }

  /**
   * 检测最佳存储方式
   */
  private async detectBestStorage(): Promise<'localStorage' | 'indexedDB'> {
    try {
      // 检查localStorage可用空间
      const localStorageSpace = this.getLocalStorageSpace();
      
      // 如果localStorage空间充足，优先使用
      if (localStorageSpace.available > this.config.localStorageLimit) {
        return 'localStorage';
      }
      
      // 否则使用IndexedDB
      return 'indexedDB';
    } catch (error) {
      console.warn('存储检测失败，使用IndexedDB:', error);
      return 'indexedDB';
    }
  }

  /**
   * 获取localStorage空间信息
   */
  private getLocalStorageSpace(): { used: number; available: number } {
    let used = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn('计算localStorage使用空间失败:', error);
    }

    const available = Math.max(0, this.config.localStorageLimit - used);
    return { used, available };
  }

  /**
   * 智能存储文件
   */
  async storeFile(fileData: {
    type: 'image' | 'video' | 'document';
    roleId: string;
    resourceType: string;
    fileName: string;
    fileSize: number;
    data: string | ArrayBuffer;
    metadata?: Record<string, any>;
  }): Promise<string> {
    await this.init();

    // 检查文件大小，决定存储方式
    if (fileData.fileSize > this.config.autoSwitchThreshold) {
      // 大文件使用IndexedDB
      return await storeFile(fileData);
    }

    // 小文件根据当前存储方式决定
    if (this.currentStorage === 'localStorage') {
      return await this.storeFileToLocalStorage(fileData);
    } else {
      return await storeFile(fileData);
    }
  }

  /**
   * 存储文件到localStorage
   */
  private async storeFileToLocalStorage(fileData: {
    type: 'image' | 'video' | 'document';
    roleId: string;
    resourceType: string;
    fileName: string;
    fileSize: number;
    data: string | ArrayBuffer;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `file_${id}`;
    
    try {
      const fileRecord = {
        id,
        ...fileData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(fileRecord));
      return id;
    } catch (error) {
      // 如果localStorage存储失败，尝试使用IndexedDB
      console.warn('localStorage存储失败，切换到IndexedDB:', error);
      this.currentStorage = 'indexedDB';
      return await storeFile(fileData);
    }
  }

  /**
   * 获取文件
   */
  async getFile(id: string): Promise<any | null> {
    await this.init();

    // 先尝试从localStorage获取
    const localStorageKey = `file_${id}`;
    const localData = localStorage.getItem(localStorageKey);
    
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (error) {
        console.warn('localStorage数据解析失败:', error);
        localStorage.removeItem(localStorageKey);
      }
    }

    // 从IndexedDB获取
    return await getFile(id);
  }

  /**
   * 删除文件
   */
  async deleteFile(id: string): Promise<void> {
    await this.init();

    // 删除localStorage中的文件
    const localStorageKey = `file_${id}`;
    if (localStorage.getItem(localStorageKey)) {
      localStorage.removeItem(localStorageKey);
    }

    // 删除IndexedDB中的文件
    try {
      await deleteFile(id);
    } catch (error) {
      console.warn('删除IndexedDB文件失败:', error);
    }
  }

  /**
   * 存储角色资源
   */
  async storeRoleResources(roleId: string, resources: Record<string, any[]>): Promise<void> {
    await this.init();

    if (this.currentStorage === 'localStorage') {
      // 检查数据大小
      const dataSize = JSON.stringify(resources).length;
      
      if (dataSize > this.config.autoSwitchThreshold) {
        // 数据过大，使用IndexedDB
        await storeRoleResources(roleId, resources);
        return;
      }

      // 使用localStorage
      try {
        localStorage.setItem('admin_role_resources_v1', JSON.stringify({
          ...JSON.parse(localStorage.getItem('admin_role_resources_v1') || '{}'),
          [roleId]: resources
        }));
      } catch (error) {
        // 如果localStorage存储失败，切换到IndexedDB
        console.warn('localStorage存储失败，切换到IndexedDB:', error);
        this.currentStorage = 'indexedDB';
        await storeRoleResources(roleId, resources);
      }
    } else {
      await storeRoleResources(roleId, resources);
    }
  }

  /**
   * 获取角色资源
   */
  async getRoleResources(roleId: string): Promise<any | null> {
    await this.init();

    if (this.currentStorage === 'localStorage') {
      try {
        const data = localStorage.getItem('admin_role_resources_v1');
        if (data) {
          const resources = JSON.parse(data);
          return resources[roleId] || null;
        }
      } catch (error) {
        console.warn('localStorage数据获取失败:', error);
      }
    }

    // 从IndexedDB获取角色资源
    try {
      const result = await dbManager.get('roleResources', roleId);
      return (result as any)?.resources || null;
    } catch (error) {
      console.error('IndexedDB获取角色资源失败:', error);
      return null;
    }
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<{
    currentStorage: string;
    localStorage: { used: number; available: number; limit: number };
    indexedDB: { totalFiles: number; totalSize: number; roleCount: number };
    recommendations: string[];
  }> {
    await this.init();

    const localStorageStats = this.getLocalStorageSpace();
    const indexedDBStats = await getIndexedDBStats();

    const recommendations: string[] = [];
    
    if (localStorageStats.used > this.config.localStorageLimit * 0.8) {
      recommendations.push('localStorage使用率较高，建议清理或迁移到IndexedDB');
    }

    if (indexedDBStats.totalSize > 100 * 1024 * 1024) { // 100MB
      recommendations.push('IndexedDB数据量较大，建议定期清理过期文件');
    }

    return {
      currentStorage: this.currentStorage || 'unknown',
      localStorage: {
        used: localStorageStats.used,
        available: localStorageStats.available,
        limit: this.config.localStorageLimit
      },
      indexedDB: indexedDBStats,
      recommendations
    };
  }

  /**
   * 数据迁移
   */
  async migrateData(): Promise<{ success: number; failed: number }> {
    await this.init();
    
    if (this.currentStorage === 'indexedDB') {
      return await migrateFromLocalStorage();
    } else {
      throw new Error('当前使用localStorage，无需迁移');
    }
  }

  /**
   * 切换存储方式
   */
  async switchStorage(type: 'localStorage' | 'indexedDB'): Promise<void> {
    if (type === this.currentStorage) return;

    if (type === 'indexedDB') {
      // 迁移数据到IndexedDB
      await this.migrateData();
    }

    this.currentStorage = type;
    console.log(`存储方式已切换到: ${type}`);
  }

  /**
   * 清理存储
   */
  async cleanup(): Promise<{ localStorage: number; indexedDB: number }> {
    await this.init();

    let localStorageCleaned = 0;
    let indexedDBCleaned = 0;

    // 清理localStorage中的临时文件
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('file_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      localStorageCleaned++;
    });

    // 清理IndexedDB中的过期文件
    try {
      indexedDBCleaned = await this.cleanupExpiredFiles();
    } catch (error) {
      console.warn('清理IndexedDB过期文件失败:', error);
    }

    return { localStorage: localStorageCleaned, indexedDB: indexedDBCleaned };
  }

  /**
   * 清理过期文件
   */
  private async cleanupExpiredFiles(): Promise<number> {
    // 这里可以调用IndexedDB的清理函数
    return 0;
  }
}

// 创建全局混合存储管理器实例
export const hybridStorage = new HybridStorageManager();

// 导出便捷函数
export const storeFileHybrid = (fileData: any) => hybridStorage.storeFile(fileData);
export const getFileHybrid = (id: string) => hybridStorage.getFile(id);
export const deleteFileHybrid = (id: string) => hybridStorage.deleteFile(id);
export const storeRoleResourcesHybrid = (roleId: string, resources: any) => hybridStorage.storeRoleResources(roleId, resources);
export const getRoleResourcesHybrid = (roleId: string) => hybridStorage.getRoleResources(roleId);
export const getStorageStatsHybrid = () => hybridStorage.getStorageStats();
export const migrateDataHybrid = () => hybridStorage.migrateData();
export const switchStorageHybrid = (type: 'localStorage' | 'indexedDB') => hybridStorage.switchStorage(type);
export const cleanupHybrid = () => hybridStorage.cleanup();
