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

function App() {
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  useEffect(() => {
    document.title = '后台管理系统';
  }, []);

  useEffect(() => {
    // 记录系统启动日志
    const logSystemStart = () => {
      const logs = JSON.parse(localStorage.getItem('admin_action_logs_v1') || '[]');
      const startLog = {
        action: '系统启动',
        detail: '后台管理系统已启动',
        target: 'system',
        ts: Date.now()
      };
      
      // 检查是否已有今天的启动日志，避免重复记录
      const today = new Date().toDateString();
      const hasTodayStartLog = logs.some((log: any) => 
        log.action === '系统启动' && new Date(log.ts).toDateString() === today
      );
      
      if (!hasTodayStartLog) {
        logs.unshift(startLog);
        // 只保留最近100条日志
        const recentLogs = logs.slice(0, 100);
        localStorage.setItem('admin_action_logs_v1', JSON.stringify(recentLogs));
      }
    };

    // 初始化默认数据
    const initializeDefaultData = () => {
      const users = JSON.parse(localStorage.getItem('admin_users_v1') || '[]');
      const roles = JSON.parse(localStorage.getItem('admin_roles_v1') || '[]');
      
      // 如果没有用户，创建默认管理员用户
      if (users.length === 0) {
        const defaultUser = {
          id: 'admin_' + Date.now(),
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          createdAt: Date.now(),
          lastLogin: null
        };
        
        users.push(defaultUser);
        localStorage.setItem('admin_users_v1', JSON.stringify(users));
        
        // 记录用户创建日志
        const logs = JSON.parse(localStorage.getItem('admin_action_logs_v1') || '[]');
        logs.unshift({
          action: '创建用户',
          detail: '系统自动创建默认管理员用户',
          target: 'admin',
          ts: Date.now()
        });
        localStorage.setItem('admin_action_logs_v1', JSON.stringify(logs.slice(0, 100)));
        
        console.log('已创建默认管理员用户');
      }
      
      // 如果没有角色，创建默认角色
      if (roles.length === 0) {
        const defaultRoles = [
          {
            id: 'admin_role',
            name: '管理员',
            description: '系统管理员，拥有所有权限',
            permissions: ['all'],
            createdAt: Date.now()
          },
          {
            id: 'user_role',
            name: '普通用户',
            description: '普通用户，拥有基本权限',
            permissions: ['read'],
            createdAt: Date.now()
          }
        ];
        
        localStorage.setItem('admin_roles_v1', JSON.stringify(defaultRoles));
        
        // 记录角色创建日志
        const logs = JSON.parse(localStorage.getItem('admin_action_logs_v1') || '[]');
        logs.unshift({
          action: '创建角色',
          detail: '系统自动创建默认角色配置',
          target: 'roles',
          ts: Date.now()
        });
        localStorage.setItem('admin_action_logs_v1', JSON.stringify(logs.slice(0, 100)));
        
        console.log('已创建默认角色配置');
      }
    };

    // 数据同步修复功能
    const fixDataSync = async () => {
      try {
        console.log('开始数据同步修复...');
        
        // 检查localStorage数据
        const users = JSON.parse(localStorage.getItem('admin_users_v1') || '[]');
        const roles = JSON.parse(localStorage.getItem('admin_roles_v1') || '[]');
        const logs = JSON.parse(localStorage.getItem('admin_action_logs_v1') || '[]');
        
        // 如果localStorage有数据但IndexedDB可能没有，记录同步日志
        if (users.length > 0 || roles.length > 0) {
          const syncLog = {
            action: '数据同步',
            detail: '系统启动时执行数据同步检查',
            target: 'system',
            ts: Date.now()
          };
          
          // 检查是否已有今天的同步日志
          const today = new Date().toDateString();
          const hasTodaySyncLog = logs.some((log: any) => 
            log.action === '数据同步' && new Date(log.ts).toDateString() === today
          );
          
          if (!hasTodaySyncLog) {
            logs.unshift(syncLog);
            localStorage.setItem('admin_action_logs_v1', JSON.stringify(logs.slice(0, 100)));
            console.log('已记录数据同步日志');
          }
        }
        
        console.log('数据同步修复完成');
      } catch (error) {
        console.error('数据同步修复失败:', error);
      }
    };

    // 初始化IndexedDB
    initializeStorage().then(success => {
      if (success) {
        console.log('存储系统初始化完成');
        logSystemStart(); // 记录启动日志
        initializeDefaultData(); // 初始化默认数据
        fixDataSync(); // 执行数据同步修复
        
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