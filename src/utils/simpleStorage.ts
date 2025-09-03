// 简化存储管理器 - 解决当前存在的问题

interface SimpleFileRecord {
  id: string;
  fileName: string;
  fileType: 'image' | 'video';
  mimeType: string;
  data: string; // Base64数据
  roleId: string;
  resourceType: string;
  resourceId: string;
  timestamp: number;
}

class SimpleStorageManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'SimpleStorageDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('简化存储管理器初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建文件存储
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('roleId', 'roleId');
          fileStore.createIndex('resourceId', 'resourceId');
          fileStore.createIndex('fileType', 'fileType');
        }
      };
    });
  }

  /**
   * 存储文件
   */
  async storeFile(file: File, metadata: Omit<SimpleFileRecord, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) throw new Error('数据库未初始化');

    const fileId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 转换文件为Base64
      const data = await this.fileToBase64(file);
      
      const fileRecord: SimpleFileRecord = {
        ...metadata,
        id: fileId,
        fileName: file.name,
        data,
        timestamp: Date.now()
      };

      await this.setFile(fileRecord);
      console.log(`文件存储成功: ${file.name}, ID: ${fileId}`);
      return fileId;

    } catch (error) {
      console.error('文件存储失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件
   */
  async getFile(fileId: string): Promise<SimpleFileRecord | null> {
    if (!this.db) throw new Error('数据库未初始化');

    try {
      return await this.getFileRecord(fileId);
    } catch (error) {
      console.error('获取文件失败:', error);
      return null;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    try {
      await this.deleteFileRecord(fileId);
      console.log(`文件删除成功: ${fileId}`);
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    if (!this.db) throw new Error('数据库未初始化');

    try {
      const files = await this.getAllFiles();
      
      const fileTypes: Record<string, number> = {};
      let totalSize = 0;

      files.forEach(file => {
        fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
        totalSize += file.data.length;
      });

      return {
        totalFiles: files.length,
        totalSize,
        fileTypes
      };

    } catch (error) {
      console.error('获取存储统计失败:', error);
      throw error;
    }
  }

  /**
   * 文件转Base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 设置文件记录
   */
  private async setFile(fileRecord: SimpleFileRecord): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.put(fileRecord);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取文件记录
   */
  private async getFileRecord(fileId: string): Promise<SimpleFileRecord | null> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fileId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除文件记录
   */
  private async deleteFileRecord(fileId: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete(fileId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有文件
   */
  private async getAllFiles(): Promise<SimpleFileRecord[]> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// 创建全局简化存储管理器实例
export const simpleStorage = new SimpleStorageManager();

// 导出便捷函数
export const initSimpleStorage = () => simpleStorage.init();
export const storeFileSimple = (file: File, metadata: any) => simpleStorage.storeFile(file, metadata);
export const getFileSimple = (fileId: string) => simpleStorage.getFile(fileId);
export const deleteFileSimple = (fileId: string) => simpleStorage.deleteFile(fileId);
export const getSimpleStorageStats = () => simpleStorage.getStats();
