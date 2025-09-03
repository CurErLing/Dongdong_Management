// IndexedDB存储管理器 - 支持几GB数据存储

interface DBConfig {
  name: string;
  version: number;
  stores: Array<{
    name: string;
    keyPath: string;
    indexes?: Array<{ name: string; keyPath: string; options?: IDBIndexParameters }>;
  }>;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: DBConfig;

  constructor(config: DBConfig) {
    this.config = config;
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        this.config.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
            
            // 创建索引
            storeConfig.indexes?.forEach(indexConfig => {
              store.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
            });
          }
        });
      };
    });
  }

  /**
   * 存储数据
   */
  async set<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取数据
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空存储
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取存储大小
   */
  async getStoreSize(storeName: string): Promise<number> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 数据库配置
const DB_CONFIG: DBConfig = {
  name: 'DongdongManagementDB',
  version: 1,
  stores: [
    {
      name: 'roleResources',
      keyPath: 'roleId',
      indexes: [
        { name: 'roleId', keyPath: 'roleId' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    {
      name: 'files',
      keyPath: 'id',
      indexes: [
        { name: 'id', keyPath: 'id' },
        { name: 'type', keyPath: 'type' },
        { name: 'roleId', keyPath: 'roleId' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    {
      name: 'metadata',
      keyPath: 'key',
      indexes: [
        { name: 'key', keyPath: 'key' },
        { name: 'category', keyPath: 'category' }
      ]
    }
  ]
};

// 创建全局数据库实例
export const dbManager = new IndexedDBManager(DB_CONFIG);

// 文件存储接口
export interface FileRecord {
  id: string;
  type: 'image' | 'video' | 'document';
  roleId: string;
  resourceType: string;
  fileName: string;
  fileSize: number;
  data: string | ArrayBuffer;
  timestamp: number;
  metadata?: Record<string, any>;
}

// 角色资源存储接口
export interface RoleResourceRecord {
  roleId: string;
  resources: Record<string, any[]>;
  timestamp: number;
  version: string;
}

// 元数据存储接口
export interface MetadataRecord {
  key: string;
  category: string;
  value: any;
  timestamp: number;
}

/**
 * 初始化IndexedDB
 */
export const initIndexedDB = async (): Promise<void> => {
  try {
    await dbManager.init();
    console.log('IndexedDB初始化成功');
  } catch (error) {
    console.error('IndexedDB初始化失败:', error);
    throw error;
  }
};

/**
 * 存储文件到IndexedDB
 */
export const storeFile = async (fileRecord: Omit<FileRecord, 'id' | 'timestamp'>): Promise<string> => {
  const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const record: FileRecord = {
    ...fileRecord,
    id,
    timestamp: Date.now()
  };

  await dbManager.set('files', record);
  return id;
};

/**
 * 从IndexedDB获取文件
 */
export const getFile = async (id: string): Promise<FileRecord | null> => {
  return await dbManager.get<FileRecord>('files', id);
};

/**
 * 删除文件
 */
export const deleteFile = async (id: string): Promise<void> => {
  await dbManager.delete('files', id);
};

/**
 * 获取角色的所有文件
 */
export const getRoleFiles = async (roleId: string, type?: string): Promise<FileRecord[]> => {
  const allFiles = await dbManager.getAll<FileRecord>('files');
  return allFiles.filter(file => 
    file.roleId === roleId && (!type || file.type === type)
  );
};

/**
 * 存储角色资源
 */
export const storeRoleResources = async (roleId: string, resources: Record<string, any[]>): Promise<void> => {
  const record: RoleResourceRecord = {
    roleId,
    resources,
    timestamp: Date.now(),
    version: '1.0'
  };

  await dbManager.set('roleResources', record);
};

/**
 * 获取角色资源
 */
export const getRoleResources = async (roleId: string): Promise<RoleResourceRecord | null> => {
  return await dbManager.get<RoleResourceRecord>('roleResources', roleId);
};

/**
 * 获取存储统计信息
 */
export const getIndexedDBStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  roleCount: number;
  fileTypes: Record<string, number>;
}> => {
  const files = await dbManager.getAll<FileRecord>('files');
  const roles = await dbManager.getAll<RoleResourceRecord>('roleResources');

  const fileTypes: Record<string, number> = {};
  let totalSize = 0;

  files.forEach(file => {
    fileTypes[file.type] = (fileTypes[file.type] || 0) + 1;
    totalSize += file.fileSize;
  });

  return {
    totalFiles: files.length,
    totalSize,
    roleCount: roles.length,
    fileTypes
  };
};

/**
 * 清理过期文件
 */
export const cleanupExpiredFiles = async (maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> => {
  const files = await dbManager.getAll<FileRecord>('files');
  const now = Date.now();
  let cleanedCount = 0;

  for (const file of files) {
    if (now - file.timestamp > maxAge) {
      await dbManager.delete('files', file.id);
      cleanedCount++;
    }
  }

  return cleanedCount;
};

/**
 * 从localStorage迁移数据到IndexedDB
 */
export const migrateFromLocalStorage = async (): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  try {
    // 迁移角色资源
    const roleResourcesKey = 'admin_role_resources_v1';
    const roleResourcesData = localStorage.getItem(roleResourcesKey);
    
    if (roleResourcesData) {
      try {
        const resources = JSON.parse(roleResourcesData);
        for (const [roleId, resourceData] of Object.entries(resources)) {
          await storeRoleResources(roleId, resourceData as any);
          success++;
        }
        // 迁移成功后删除localStorage数据
        localStorage.removeItem(roleResourcesKey);
      } catch (error) {
        console.error('迁移角色资源失败:', error);
        failed++;
      }
    }

    // 迁移其他数据...
    const keysToMigrate = [
      'admin_roles_v1',
      'admin_users_v1',
      'admin_action_logs_v1'
    ];

    for (const key of keysToMigrate) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          await dbManager.set('metadata', {
            key,
            category: 'migrated',
            value: JSON.parse(data),
            timestamp: Date.now()
          });
          success++;
        } catch (error) {
          console.error(`迁移${key}失败:`, error);
          failed++;
        }
      }
    }

  } catch (error) {
    console.error('数据迁移失败:', error);
    failed++;
  }

  return { success, failed };
};

// 在应用启动时初始化IndexedDB
export const initializeStorage = async () => {
  try {
    console.log('开始初始化IndexedDB...');
    await initIndexedDB();
    console.log('IndexedDB初始化成功');
    
    // 测试IndexedDB是否正常工作
    const testResult = await checkIndexedDBStatus();
    console.log('IndexedDB状态检查结果:', testResult);
    
    if (!testResult.isInitialized) {
      console.error('IndexedDB初始化测试失败:', testResult.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('IndexedDB初始化失败:', error);
    return false;
  }
};

// 检查IndexedDB状态
export const checkIndexedDBStatus = async (): Promise<{
  isAvailable: boolean;
  isInitialized: boolean;
  error?: string;
}> => {
  try {
    // 检查IndexedDB是否可用
    if (!window.indexedDB) {
      return {
        isAvailable: false,
        isInitialized: false,
        error: '浏览器不支持IndexedDB'
      };
    }

    // 尝试初始化
    await initIndexedDB();
    
    // 测试基本操作
    const testId = 'test_' + Date.now();
    await dbManager.set('files', {
      id: testId,
      type: 'image',
      roleId: 'test',
      resourceType: 'test',
      fileName: 'test.jpg',
      fileSize: 100,
      data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      timestamp: Date.now()
    });

    const testRecord = await dbManager.get('files', testId);
    await dbManager.delete('files', testId);

    if (testRecord) {
      return {
        isAvailable: true,
        isInitialized: true
      };
    } else {
      return {
        isAvailable: true,
        isInitialized: false,
        error: 'IndexedDB操作测试失败'
      };
    }
  } catch (error) {
    return {
      isAvailable: true,
      isInitialized: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

// 检查IndexedDB中的数据完整性
export const checkDataIntegrity = async (): Promise<{
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let totalFiles = 0;
  let validFiles = 0;
  let invalidFiles = 0;

  try {
    const files = await dbManager.getAll('files');
    totalFiles = files.length;
    
    console.log(`检查 ${totalFiles} 个文件的数据完整性...`);
    
    for (const file of files) {
      try {
        const fileData = (file as any).data;
        
        if (!fileData) {
          errors.push(`文件 ${(file as any).id} 缺少数据字段`);
          invalidFiles++;
          continue;
        }
        
        if (typeof fileData !== 'string') {
          errors.push(`文件 ${(file as any).id} 数据不是字符串类型`);
          invalidFiles++;
          continue;
        }
        
        if (!fileData.startsWith('data:')) {
          errors.push(`文件 ${(file as any).id} 数据不是有效的Base64格式`);
          invalidFiles++;
          continue;
        }
        
        validFiles++;
      } catch (error) {
        errors.push(`文件 ${(file as any).id} 检查失败: ${error}`);
        invalidFiles++;
      }
    }
    
    console.log(`数据完整性检查完成: 总计 ${totalFiles}, 有效 ${validFiles}, 无效 ${invalidFiles}`);
    
  } catch (error) {
    errors.push(`数据完整性检查失败: ${error}`);
  }
  
  return { totalFiles, validFiles, invalidFiles, errors };
};

// 清理无效的文件数据
export const cleanupInvalidFiles = async (): Promise<{
  cleaned: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let cleaned = 0;
  
  try {
    const files = await dbManager.getAll('files');
    
    for (const file of files) {
      try {
        const fileData = (file as any).data;
        
        if (!fileData || typeof fileData !== 'string' || !fileData.startsWith('data:')) {
          await dbManager.delete('files', (file as any).id);
          cleaned++;
          console.log(`清理无效文件: ${(file as any).id}`);
        }
      } catch (error) {
        errors.push(`清理文件 ${(file as any).id} 失败: ${error}`);
      }
    }
    
  } catch (error) {
    errors.push(`清理过程失败: ${error}`);
  }
  
  return { cleaned, errors };
};
