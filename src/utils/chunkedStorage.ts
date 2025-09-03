// 分片存储管理器 - 专门处理大文件存储

interface ChunkInfo {
  id: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string; // Base64数据
  size: number;
  timestamp: number;
}

interface FileMetadata {
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  mimeType: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  roleId: string;
  resourceType: string;
  resourceId: string;
  createdAt: number;
  updatedAt: number;
  status: 'uploading' | 'completed' | 'error';
  metadata?: Record<string, any>;
}

class ChunkedStorageManager {
  private db: IDBDatabase | null = null;
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB per chunk

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChunkedStorageDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 文件元数据存储
        if (!db.objectStoreNames.contains('fileMetadata')) {
          const metadataStore = db.createObjectStore('fileMetadata', { keyPath: 'id' });
          metadataStore.createIndex('roleId', 'roleId');
          metadataStore.createIndex('resourceId', 'resourceId');
          metadataStore.createIndex('fileType', 'fileType');
        }
        
        // 文件分片存储
        if (!db.objectStoreNames.contains('fileChunks')) {
          const chunkStore = db.createObjectStore('fileChunks', { keyPath: 'id' });
          chunkStore.createIndex('fileId', 'fileId');
          chunkStore.createIndex('chunkIndex', 'chunkIndex');
        }
      };
    });
  }

  /**
   * 分片存储文件
   */
  async storeFile(file: File, metadata: Omit<FileMetadata, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    if (!this.db) throw new Error('数据库未初始化');

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    
    try {
      // 创建文件元数据
      const fileMetadata: FileMetadata = {
        ...metadata,
        id: fileId,
        fileName: file.name,
        totalSize: file.size,
        chunkSize: this.CHUNK_SIZE,
        totalChunks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'uploading'
      };

      await this.setMetadata(fileMetadata);

      // 分片存储文件
      const chunks = await this.splitFileIntoChunks(file, fileId, totalChunks);
      
      for (const chunk of chunks) {
        await this.storeChunk(chunk);
      }

      // 更新状态为完成
      fileMetadata.status = 'completed';
      fileMetadata.updatedAt = Date.now();
      await this.setMetadata(fileMetadata);

      console.log(`文件 ${file.name} 分片存储完成，共 ${totalChunks} 个分片`);
      return fileId;

    } catch (error) {
      console.error('分片存储失败:', error);
      throw error;
    }
  }

  /**
   * 将文件分割成分片
   */
  private async splitFileIntoChunks(file: File, fileId: string, totalChunks: number): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const chunkData = await this.fileToBase64(chunk);
      
      chunks.push({
        id: `${fileId}_chunk_${i}`,
        fileId,
        chunkIndex: i,
        totalChunks,
        data: chunkData,
        size: chunk.size,
        timestamp: Date.now()
      });
    }
    
    return chunks;
  }

  /**
   * 文件转Base64
   */
  private fileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 存储分片
   */
  private async storeChunk(chunk: ChunkInfo): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileChunks'], 'readwrite');
      const store = transaction.objectStore('fileChunks');
      const request = store.put(chunk);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 设置文件元数据
   */
  private async setMetadata(metadata: FileMetadata): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileMetadata'], 'readwrite');
      const store = transaction.objectStore('fileMetadata');
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取文件内容
   */
  async getFile(fileId: string): Promise<{ metadata: FileMetadata; data: string } | null> {
    if (!this.db) throw new Error('数据库未初始化');

    try {
      // 获取文件元数据
      const metadata = await this.getMetadata(fileId);
      if (!metadata) {
        console.log('文件元数据不存在:', fileId);
        return null;
      }

      // 获取所有分片
      const chunks = await this.getChunks(fileId);
      if (chunks.length !== metadata.totalChunks) {
        console.error(`分片数量不匹配: 期望 ${metadata.totalChunks}, 实际 ${chunks.length}`);
        return null;
      }

      // 按顺序合并分片
      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      const combinedData = sortedChunks.map(chunk => chunk.data).join('');

      return { metadata, data: combinedData };

    } catch (error) {
      console.error('获取文件失败:', error);
      return null;
    }
  }

  /**
   * 获取文件元数据
   */
  private async getMetadata(fileId: string): Promise<FileMetadata | null> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileMetadata'], 'readonly');
      const store = transaction.objectStore('fileMetadata');
      const request = store.get(fileId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取文件分片
   */
  private async getChunks(fileId: string): Promise<ChunkInfo[]> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileChunks'], 'readonly');
      const store = transaction.objectStore('fileChunks');
      const index = store.index('fileId');
      const request = index.getAll(fileId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    try {
      // 删除所有分片
      const chunks = await this.getChunks(fileId);
      for (const chunk of chunks) {
        await this.deleteChunk(chunk.id);
      }

      // 删除元数据
      await this.deleteMetadata(fileId);

      console.log(`文件 ${fileId} 删除完成`);

    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除分片
   */
  private async deleteChunk(chunkId: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileChunks'], 'readwrite');
      const store = transaction.objectStore('fileChunks');
      const request = store.delete(chunkId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除元数据
   */
  private async deleteMetadata(fileId: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileMetadata'], 'readwrite');
      const store = transaction.objectStore('fileMetadata');
      const request = store.delete(fileId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    totalChunks: number;
    fileTypes: Record<string, number>;
  }> {
    if (!this.db) throw new Error('数据库未初始化');

    try {
      const metadata = await this.getAllMetadata();
      const chunks = await this.getAllChunks();

      const fileTypes: Record<string, number> = {};
      let totalSize = 0;

      metadata.forEach(file => {
        fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
        totalSize += file.totalSize;
      });

      return {
        totalFiles: metadata.length,
        totalSize,
        totalChunks: chunks.length,
        fileTypes
      };

    } catch (error) {
      console.error('获取存储统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有元数据
   */
  private async getAllMetadata(): Promise<FileMetadata[]> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileMetadata'], 'readonly');
      const store = transaction.objectStore('fileMetadata');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有分片
   */
  private async getAllChunks(): Promise<ChunkInfo[]> {
    if (!this.db) throw new Error('数据库未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fileChunks'], 'readonly');
      const store = transaction.objectStore('fileChunks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// 创建全局分片存储管理器实例
export const chunkedStorage = new ChunkedStorageManager();

// 导出便捷函数
export const storeFileChunked = (file: File, metadata: any) => chunkedStorage.storeFile(file, metadata);
export const getFileChunked = (fileId: string) => chunkedStorage.getFile(fileId);
export const deleteFileChunked = (fileId: string) => chunkedStorage.deleteFile(fileId);
export const getStorageStatsChunked = () => chunkedStorage.getStorageStats();
export const initChunkedStorage = () => chunkedStorage.init();

// 调试工具 - 检查分片存储状态
export const debugChunkedStorage = async () => {
  try {
    console.log('=== 分片存储调试信息 ===');
    
    // 检查数据库是否初始化
    const stats = await getStorageStatsChunked();
    console.log('分片存储统计:', stats);
    
    // 检查数据库结构
    const db = indexedDB.open('ChunkedStorageDB', 1);
    db.onsuccess = () => {
      const database = db.result;
      console.log('分片存储数据库:', database);
      console.log('对象存储:', database.objectStoreNames);
      
      // 检查元数据存储
      const metadataTransaction = database.transaction(['fileMetadata'], 'readonly');
      const metadataStore = metadataTransaction.objectStore('fileMetadata');
      const metadataRequest = metadataStore.getAll();
      
      metadataRequest.onsuccess = () => {
        console.log('文件元数据:', metadataRequest.result);
      };
      
      // 检查分片存储
      const chunkTransaction = database.transaction(['fileChunks'], 'readonly');
      const chunkStore = chunkTransaction.objectStore('fileChunks');
      const chunkRequest = chunkStore.getAll();
      
      chunkRequest.onsuccess = () => {
        console.log('文件分片:', chunkRequest.result);
      };
    };
    
    db.onerror = () => {
      console.error('无法打开分片存储数据库:', db.error);
    };
    
  } catch (error) {
    console.error('分片存储调试失败:', error);
  }
};
