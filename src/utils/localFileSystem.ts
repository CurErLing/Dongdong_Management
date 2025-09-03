// 本地文件系统管理器 - 将资源保存到本地文件系统

// 添加文件系统API的类型声明
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
      startIn?: string;
    }): Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemFileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: FileSystemWriteChunkType): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

type FileSystemWriteChunkType = BufferSource | Blob | string;

interface FileSystemHandle {
  name: string;
  kind: 'file' | 'directory';
}

// 导入必要的类型
import type { RoleResourcesStore } from '../types';

interface LocalFileInfo {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  roleId: string;
  resourceType: string;
  resourceId: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

interface LocalResourceData {
  roleId: string;
  resources: RoleResourcesStore;
  exportedAt: number;
  version: string;
}

class LocalFileSystemManager {
  private readonly BASE_DIR = 'DongdongManagement';
  private readonly RESOURCES_DIR = 'resources';
  private readonly BACKUP_DIR = 'backups';
  private readonly METADATA_FILE = 'metadata.json';

  /**
   * 初始化本地文件系统
   */
  async init(): Promise<void> {
    try {
      // 检查是否支持文件系统API
      if (!('showDirectoryPicker' in window)) {
        throw new Error('浏览器不支持文件系统API');
      }
      
      console.log('本地文件系统管理器初始化完成');
    } catch (error) {
      console.error('本地文件系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 选择本地文件夹
   */
  async selectDirectory(): Promise<FileSystemDirectoryHandle> {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      console.log('选择的文件夹:', dirHandle.name);
      return dirHandle;
    } catch (error) {
      console.error('选择文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 创建项目文件夹结构
   */
  async createProjectStructure(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    try {
      // 创建主项目文件夹
      const projectDir = await dirHandle.getDirectoryHandle(this.BASE_DIR, { create: true });
      
      // 创建资源文件夹
      await projectDir.getDirectoryHandle(this.RESOURCES_DIR, { create: true });
      
      // 创建备份文件夹
      await projectDir.getDirectoryHandle(this.BACKUP_DIR, { create: true });
      
      console.log('项目文件夹结构创建完成');
    } catch (error) {
      console.error('创建项目结构失败:', error);
      throw error;
    }
  }

  /**
   * 保存文件到本地
   */
  async saveFileToLocal(
    file: File, 
    metadata: Omit<LocalFileInfo, 'id' | 'createdAt' | 'filePath'>
  ): Promise<string> {
    try {
      const dirHandle = await this.selectDirectory();
      const projectDir = await dirHandle.getDirectoryHandle(this.BASE_DIR, { create: true });
      const resourcesDir = await projectDir.getDirectoryHandle(this.RESOURCES_DIR, { create: true });
      
      // 生成文件ID和路径
      const fileId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${fileId}_${file.name}`;
      
      // 创建文件
      const fileHandle = await resourcesDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
      
      // 保存文件信息
      const fileInfo: LocalFileInfo = {
        ...metadata,
        id: fileId,
        fileName: file.name,
        filePath: `${this.RESOURCES_DIR}/${fileName}`,
        fileSize: file.size,
        createdAt: Date.now()
      };
      
      // 保存元数据
      await this.saveMetadata(projectDir, fileInfo);
      
      console.log(`文件保存到本地成功: ${fileName}`);
      return fileId;
      
    } catch (error) {
      console.error('保存文件到本地失败:', error);
      throw error;
    }
  }

  /**
   * 从本地读取文件
   */
  async readFileFromLocal(fileId: string): Promise<File | null> {
    try {
      const dirHandle = await this.selectDirectory();
      const projectDir = await dirHandle.getDirectoryHandle(this.BASE_DIR, { create: true });
      const resourcesDir = await projectDir.getDirectoryHandle(this.RESOURCES_DIR, { create: true });
      
      // 获取文件信息
      const metadata = await this.getMetadata(projectDir, fileId);
      if (!metadata) {
        console.log('文件元数据不存在:', fileId);
        return null;
      }
      
      // 读取文件
      const fileHandle = await resourcesDir.getFileHandle(metadata.fileName);
      const file = await fileHandle.getFile();
      
      console.log(`从本地读取文件成功: ${metadata.fileName}`);
      return file;
      
    } catch (error) {
      console.error('从本地读取文件失败:', error);
      return null;
    }
  }

  /**
   * 导出所有资源到本地
   */
  async exportAllResources(roleResources: RoleResourcesStore): Promise<void> {
    try {
      const dirHandle = await this.selectDirectory();
      await this.createProjectStructure(dirHandle);
      const projectDir = await dirHandle.getDirectoryHandle(this.BASE_DIR, { create: true });
      
      // 创建导出数据
      const exportData: LocalResourceData = {
        roleId: 'all',
        resources: roleResources,
        exportedAt: Date.now(),
        version: '1.0'
      };
      
      // 保存导出文件
      const exportFile = new File(
        [JSON.stringify(exportData, null, 2)], 
        `resources_export_${new Date().toISOString().split('T')[0]}.json`,
        { type: 'application/json' }
      );
      
      const exportHandle = await projectDir.getFileHandle(exportFile.name, { create: true });
      const writable = await exportHandle.createWritable();
      await writable.write(exportFile);
      await writable.close();
      
      console.log('所有资源导出成功');
      
    } catch (error) {
      console.error('导出资源失败:', error);
      throw error;
    }
  }

  /**
   * 从本地导入资源
   */
  async importResourcesFromLocal(): Promise<RoleResourcesStore | null> {
    try {
      const dirHandle = await this.selectDirectory();
      const projectDir = await dirHandle.getDirectoryHandle(this.BASE_DIR, { create: true });
      
      // 查找最新的导出文件
      const files: FileSystemHandle[] = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('resources_export_')) {
          files.push(entry);
        }
      }
      
      if (files.length === 0) {
        console.log('没有找到导出文件');
        return null;
      }
      
      // 选择最新的文件
      const latestFile = files.sort((a, b) => b.name.localeCompare(a.name))[0];
      const fileHandle = await projectDir.getFileHandle(latestFile.name);
      const file = await fileHandle.getFile();
      
      // 读取数据
      const content = await file.text();
      const importData: LocalResourceData = JSON.parse(content);
      
      console.log('从本地导入资源成功');
      return importData.resources;
      
    } catch (error) {
      console.error('导入资源失败:', error);
      return null;
    }
  }

  /**
   * 保存文件元数据
   */
  private async saveMetadata(dirHandle: FileSystemDirectoryHandle, fileInfo: LocalFileInfo): Promise<void> {
    try {
      const metadataHandle = await dirHandle.getFileHandle(this.METADATA_FILE, { create: true });
      const writable = await metadataHandle.createWritable();
      
      // 读取现有元数据
      let metadata: LocalFileInfo[] = [];
      try {
        const file = await metadataHandle.getFile();
        const content = await file.text();
        metadata = JSON.parse(content);
      } catch (error) {
        // 文件不存在，使用空数组
      }
      
      // 添加新文件信息
      metadata.push(fileInfo);
      
      // 保存更新后的元数据
      const metadataFile = new File([JSON.stringify(metadata, null, 2)], this.METADATA_FILE, {
        type: 'application/json'
      });
      await writable.write(metadataFile);
      await writable.close();
      
    } catch (error) {
      console.error('保存元数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件元数据
   */
  private async getMetadata(dirHandle: FileSystemDirectoryHandle, fileId: string): Promise<LocalFileInfo | null> {
    try {
      const metadataHandle = await dirHandle.getFileHandle(this.METADATA_FILE);
      const file = await metadataHandle.getFile();
      const content = await file.text();
      const metadata: LocalFileInfo[] = JSON.parse(content);
      
      return metadata.find(info => info.id === fileId) || null;
      
    } catch (error) {
      console.error('获取元数据失败:', error);
      return null;
    }
  }

  /**
   * 获取本地存储统计
   */
  async getLocalStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    lastExport: number | null;
  }> {
    try {
      const dirHandle = await this.selectDirectory();
      const projectDir = await dirHandle.getDirectoryHandle(this.BASE_DIR, { create: true });
      
      // 读取元数据
      let metadata: LocalFileInfo[] = [];
      try {
        const metadataHandle = await projectDir.getFileHandle(this.METADATA_FILE);
        const file = await metadataHandle.getFile();
        const content = await file.text();
        metadata = JSON.parse(content);
      } catch (error) {
        // 元数据文件不存在
      }
      
      // 计算统计信息
      const fileTypes: Record<string, number> = {};
      let totalSize = 0;
      
      metadata.forEach(file => {
        const ext = file.fileName.split('.').pop() || 'unknown';
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        totalSize += file.fileSize;
      });
      
      // 查找最新导出时间
      let lastExport: number | null = null;
      for await (const entry of projectDir.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('resources_export_')) {
          const fileHandle = await projectDir.getFileHandle(entry.name);
          const file = await fileHandle.getFile();
          const time = file.lastModified;
          if (!lastExport || time > lastExport) {
            lastExport = time;
          }
        }
      }
      
      return {
        totalFiles: metadata.length,
        totalSize,
        fileTypes,
        lastExport
      };
      
    } catch (error) {
      console.error('获取本地存储统计失败:', error);
      throw error;
    }
  }
}

// 创建全局本地文件系统管理器实例
export const localFileSystem = new LocalFileSystemManager();

// 导出便捷函数
export const initLocalFileSystem = () => localFileSystem.init();
export const saveFileToLocal = (file: File, metadata: any) => localFileSystem.saveFileToLocal(file, metadata);
export const readFileFromLocal = (fileId: string) => localFileSystem.readFileFromLocal(fileId);
export const exportAllResources = (resources: RoleResourcesStore) => localFileSystem.exportAllResources(resources);
export const importResourcesFromLocal = () => localFileSystem.importResourcesFromLocal();
export const getLocalStorageStats = () => localFileSystem.getLocalStorageStats();
export const selectDirectory = () => localFileSystem.selectDirectory();
