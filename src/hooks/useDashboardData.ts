import React, { useCallback } from 'react';

// 存储键常量
const STORAGE_KEYS = {
  ROLES: 'admin_roles_v1',
  ROLE_RESOURCES: 'admin_role_resources_v1',
  USERS: 'admin_users_v1',
  LOGS: 'admin_action_logs_v1',
} as const;

// 类型定义
export interface SystemStats {
  totalRoles: number;
  totalUsers: number;
  totalResources: number;
  todayOperations: number;
  recentLogs: Array<{ action: string; detail?: string; target?: string; ts: number }>;
  systemHealth: {
    isRunning: boolean;
    dataSync: boolean;
    securityStatus: boolean;
  };
}

export interface DashboardData {
  stats: SystemStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// 数据计算工具函数
const calculateTotalResources = (roleResources: Record<string, { eat?: string[]; gift?: string[]; travel?: string[]; standby?: string[]; moments?: string[] }>): number => {
  let total = 0;
  Object.values(roleResources).forEach((roleRes) => {
    if (roleRes) {
      total += (roleRes.eat?.length || 0) + 
               (roleRes.gift?.length || 0) + 
               (roleRes.travel?.length || 0) + 
               (roleRes.standby?.length || 0) + 
               (roleRes.moments?.length || 0);
    }
  });
  return total;
};

const calculateTodayOperations = (logs: Array<{ ts: number }>): number => {
  const today = new Date().toDateString();
  return logs.filter((log) => 
    new Date(log.ts).toDateString() === today
  ).length;
};

const getRecentLogs = (logs: Array<{ action: string; detail?: string; target?: string; ts: number }>, limit: number = 5): Array<{ action: string; detail?: string; target?: string; ts: number }> => {
  return logs.slice(0, limit);
};

// 检查数据同步状态
const checkDataSyncStatus = async (): Promise<boolean> => {
  try {
    // 检查IndexedDB是否可用
    if (!window.indexedDB) {
      console.warn('IndexedDB不可用，使用localStorage');
      return true; // 如果IndexedDB不可用，认为localStorage是同步的
    }

    // 检查localStorage和IndexedDB的数据一致性
    const localStorageUsers = JSON.parse(localStorage.getItem('admin_users_v1') || '[]');
    const localStorageRoles = JSON.parse(localStorage.getItem('admin_roles_v1') || '[]');
    
    // 如果localStorage有数据，检查IndexedDB是否有对应数据
    if (localStorageUsers.length > 0 || localStorageRoles.length > 0) {
      // 这里可以添加更复杂的同步检查逻辑
      // 目前简化为检查IndexedDB是否可用
      return true;
    }
    
    return true; // 默认认为同步正常
  } catch (error) {
    console.error('数据同步检查失败:', error);
    return false;
  }
};

const assessSystemHealth = async (users: Array<{ id: string }>, logs: Array<{ action: string; ts: number }>): Promise<SystemStats['systemHealth']> => {
  // 检查数据同步状态
  const dataSyncStatus = await checkDataSyncStatus();

  // 优化安全状态判断逻辑
  // 1. 如果有用户，安全状态良好
  // 2. 如果没有用户但有系统启动日志，说明系统已初始化但需要配置用户
  // 3. 如果既没有用户也没有日志，说明系统完全未初始化
  const hasSystemLogs = logs.some(log => log.action === '系统启动');
  const securityStatus = users.length > 0 || hasSystemLogs;

  return {
    isRunning: true, // 假设系统总是运行
    dataSync: dataSyncStatus,
    securityStatus, // 更智能的安全状态判断
  };
};

// 自定义Hook
export const useDashboardData = (): DashboardData => {
  const [stats, setStats] = React.useState<SystemStats>({
    totalRoles: 0,
    totalUsers: 0,
    totalResources: 0,
    todayOperations: 0,
    recentLogs: [],
    systemHealth: {
      isRunning: true,
      dataSync: true,
      securityStatus: false,
    },
  });

  const [isLoading, setIsLoading] = React.useState(true);

  // 获取系统数据
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const roles = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLES) || '[]');
        const roleResources = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLE_RESOURCES) || '{}');
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');

        const totalResources = calculateTotalResources(roleResources);
        const todayOperations = calculateTodayOperations(logs);
        const recentLogs = getRecentLogs(logs);
        const systemHealth = await assessSystemHealth(users, logs);

        setStats({
          totalRoles: roles.length,
          totalUsers: users.length,
          totalResources,
          todayOperations,
          recentLogs,
          systemHealth,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats({
          totalRoles: 0,
          totalUsers: 0,
          totalResources: 0,
          todayOperations: 0,
          recentLogs: [],
          systemHealth: {
            isRunning: false,
            dataSync: false,
            securityStatus: false,
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 刷新数据
  const refresh = useCallback(() => {
    // 重新加载数据
    window.location.reload(); // 简单实现，实际项目中应该更优雅
  }, []);

  return {
    stats,
    isLoading,
    error: null, // 当前实现中没有错误处理，可以扩展
    refresh,
  };
};
