import { useMemo, useCallback } from 'react';

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
  recentLogs: any[];
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
const calculateTotalResources = (roleResources: any): number => {
  let total = 0;
  Object.values(roleResources).forEach((roleRes: any) => {
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

const calculateTodayOperations = (logs: any[]): number => {
  const today = new Date().toDateString();
  return logs.filter((log: any) => 
    new Date(log.ts).toDateString() === today
  ).length;
};

const getRecentLogs = (logs: any[], limit: number = 5): any[] => {
  return logs.slice(0, limit);
};

const assessSystemHealth = (users: any[], logs: any[]): SystemStats['systemHealth'] => {
  const hasRecentActivity = logs.some((log: any) => {
    const logTime = new Date(log.ts);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return logTime > oneHourAgo;
  });

  return {
    isRunning: true, // 假设系统总是运行
    dataSync: hasRecentActivity,
    securityStatus: users.length > 0, // 有用户表示系统已配置
  };
};

// 自定义Hook
export const useDashboardData = (): DashboardData => {
  // 获取系统数据
  const stats = useMemo((): SystemStats => {
    try {
      const roles = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLES) || '[]');
      const roleResources = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLE_RESOURCES) || '{}');
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');

      const totalResources = calculateTotalResources(roleResources);
      const todayOperations = calculateTodayOperations(logs);
      const recentLogs = getRecentLogs(logs);
      const systemHealth = assessSystemHealth(users, logs);

      return {
        totalRoles: roles.length,
        totalUsers: users.length,
        totalResources,
        todayOperations,
        recentLogs,
        systemHealth,
      };
    } catch (error) {
      console.error('Error parsing dashboard data:', error);
      return {
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
      };
    }
  }, []);

  // 刷新数据
  const refresh = useCallback(() => {
    // 这里可以添加数据刷新逻辑
    // 例如重新获取localStorage数据或调用API
    window.location.reload(); // 简单实现，实际项目中应该更优雅
  }, []);

  return {
    stats,
    isLoading: false, // 当前实现中没有加载状态，可以扩展
    error: null, // 当前实现中没有错误处理，可以扩展
    refresh,
  };
};
