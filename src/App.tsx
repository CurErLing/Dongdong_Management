import { useEffect, useCallback } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import { AdminLayout } from './components/admin/Layout';
import { EnhancedDashboard } from './components/admin/EnhancedDashboard';
import { RoleManager } from './components/admin/RoleManager';
import { ResourceManager } from './components/admin/ResourceManager';
import { UploadCenter } from './components/admin/UploadCenter';
import { UsersManager } from './components/admin/UsersManager';
import { Logs } from './components/admin/Logs';
import { Settings } from './components/admin/Settings';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { initializeStorage, checkDataIntegrity, cleanupInvalidFiles } from './utils/indexedDBStorage';
import { initChunkedStorage } from './utils/chunkedStorage';

function App() {
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  useEffect(() => {
    document.title = '后台管理系统';
  }, []);

  useEffect(() => {
    // 初始化IndexedDB
    initializeStorage().then(success => {
      if (success) {
        console.log('存储系统初始化完成');
        
        // 检查数据完整性
        checkDataIntegrity().then(result => {
          console.log('数据完整性检查结果:', result);
          
          if (result.invalidFiles > 0) {
            console.warn(`发现 ${result.invalidFiles} 个无效文件，开始清理...`);
            cleanupInvalidFiles().then(cleanupResult => {
              console.log('清理结果:', cleanupResult);
            });
          }
        });
      } else {
        console.error('存储系统初始化失败');
      }
    });

    // 初始化分片存储
    initChunkedStorage().then(() => {
      console.log('分片存储系统初始化完成');
    }).catch((error: any) => {
      console.error('分片存储系统初始化失败:', error);
    });
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode(!isDarkMode), [isDarkMode, setIsDarkMode]);

  const renderContent = useCallback((activeMenu: string, onMenuChange: (menu: string) => void) => {
    switch (activeMenu) {
      case 'dashboard':
        return <EnhancedDashboard onMenuChange={onMenuChange} />;
      case 'users':
        return <UsersManager />;
      case 'roles':
        return <RoleManager />;
      case 'resources':
        return <ResourceManager />;
      case 'upload':
        return <UploadCenter />;
      case 'logs':
        return <Logs />;
      case 'settings':
        return <Settings />;
      default:
        return <EnhancedDashboard onMenuChange={onMenuChange} />;
    }
  }, []);

  return (
    <ErrorBoundary>
      <AdminLayout
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        renderContent={renderContent}
      />
    </ErrorBoundary>
  );
}

export default App;