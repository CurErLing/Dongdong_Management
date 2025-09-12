import React, { useState, useEffect } from 'react';
import { Download, Upload, Folder, File, HardDrive, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  initLocalFileSystem, 
  exportAllResources, 
  importResourcesFromLocal, 
  getLocalStorageStats,
  selectDirectory 
} from '../../utils/localFileSystem';
import type { RoleResourcesStore } from '../../types';

interface LocalStorageManagerProps {
  roleResources: RoleResourcesStore;
  onImportSuccess?: (resources: RoleResourcesStore) => void;
}

export const LocalStorageManager: React.FC<LocalStorageManagerProps> = ({ 
  roleResources, 
  onImportSuccess 
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

  // 检查浏览器支持
  useEffect(() => {
    const supported = 'showDirectoryPicker' in window;
    setIsSupported(supported);
    
    if (supported) {
      initLocalFileSystem().then(() => {
        setIsInitialized(true);
      }).catch(error => {
        console.error('本地文件系统初始化失败:', error);
        setError('本地文件系统初始化失败');
      });
    } else {
      setError('浏览器不支持文件系统API');
    }
  }, []);

  // 获取存储统计
  const refreshStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storageStats = await getLocalStorageStats();
      setStats(storageStats);
      
    } catch (error) {
      console.error('获取存储统计失败:', error);
      setError('获取存储统计失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 选择文件夹
  const handleSelectDirectory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dirHandle = await selectDirectory();
      setSelectedDirectory(dirHandle.name);
      
      // 刷新统计信息
      await refreshStats();
      
    } catch (error) {
      console.error('选择文件夹失败:', error);
      setError('选择文件夹失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 导出所有资源
  const handleExportAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await exportAllResources(roleResources);
      
      // 刷新统计信息
      await refreshStats();
      
      alert('所有资源导出成功！');
      
    } catch (error) {
      console.error('导出资源失败:', error);
      setError('导出资源失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 导入资源
  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const importedResources = await importResourcesFromLocal();
      
      if (importedResources && onImportSuccess) {
        onImportSuccess(importedResources);
        alert('资源导入成功！');
      } else {
        setError('没有找到可导入的资源文件');
      }
      
    } catch (error) {
      console.error('导入资源失败:', error);
      setError('导入资源失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold text-red-600">浏览器不支持</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          您的浏览器不支持文件系统API，无法使用本地存储功能。
          <br />
          请使用Chrome 86+、Edge 86+或Firefox 111+等现代浏览器。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="text-blue-500" size={24} />
        <h3 className="text-lg font-semibold">本地文件系统管理</h3>
      </div>

      {/* 状态信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="text-green-500" size={16} />
            <span className="font-medium">当前文件夹</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {selectedDirectory || '未选择文件夹'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <File className="text-blue-500" size={16} />
            <span className="font-medium">存储状态</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isInitialized ? '已初始化' : '未初始化'}
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleSelectDirectory}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Folder size={16} />
          选择文件夹
        </button>

        <button
          onClick={handleExportAll}
          disabled={isLoading || !selectedDirectory}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          <Download size={16} />
          导出所有资源
        </button>

        <button
          onClick={handleImport}
          disabled={isLoading || !selectedDirectory}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          <Upload size={16} />
          导入资源
        </button>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw 
              className={`text-gray-500 cursor-pointer ${isLoading ? 'animate-spin' : ''}`} 
              size={16}
              onClick={refreshStats}
            />
            <span className="font-medium">存储统计</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">总文件数</p>
              <p className="text-lg font-semibold">{stats.totalFiles}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">总大小</p>
              <p className="text-lg font-semibold">{formatFileSize(stats.totalSize)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">最后导出</p>
              <p className="text-sm font-semibold">
                {stats.lastExport ? formatTime(stats.lastExport) : '从未导出'}
              </p>
            </div>
          </div>

          {Object.keys(stats.fileTypes).length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">文件类型分布</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.fileTypes).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    {type}: {String(count)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={16} />
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 首先选择本地文件夹作为存储位置</li>
          <li>• 导出功能会将所有资源保存到本地文件</li>
          <li>• 导入功能会从本地文件恢复资源数据</li>
          <li>• 数据会保存在您选择的文件夹中，不会丢失</li>
          <li>• 支持备份和恢复功能</li>
        </ul>
      </div>
    </div>
  );
};
