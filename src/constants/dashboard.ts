import { Users, Shield, FileText, Upload, Activity } from 'lucide-react';

// Dashboard配置常量
export const DASHBOARD_CONFIG = {
  // 统计卡片配置
  STAT_CARDS: [
    {
      key: 'roles',
      title: '角色总数',
      icon: Shield,
      color: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-600',
      trend: '+2 本月',
      action: 'roles'
    },
    {
      key: 'users',
      title: '用户总数',
      icon: Users,
      color: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-600',
      trend: '+5 本周',
      action: 'users'
    },
    {
      key: 'resources',
      title: '资源总数',
      icon: FileText,
      color: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-600',
      trend: '+12 今日',
      action: 'resources'
    },
    {
      key: 'operations',
      title: '今日操作',
      icon: Activity,
      color: 'bg-orange-100 dark:bg-orange-900',
      textColor: 'text-orange-600',
      trend: '活跃',
      action: 'logs'
    }
  ] as const,

  // 快捷操作配置
  QUICK_ACTIONS: [
    { key: 'users', icon: Users, label: '用户管理', action: 'users' },
    { key: 'roles', icon: Shield, label: '角色管理', action: 'roles' },
    { key: 'upload', icon: Upload, label: '文件上传', action: 'upload' },
    { key: 'settings', icon: FileText, label: '系统设置', action: 'settings' }
  ] as const,

  // 系统状态配置
  SYSTEM_STATUS: [
    { 
      key: 'running', 
      icon: '✅', 
      label: '系统运行', 
      value: '正常', 
      bgColor: 'bg-green-50 dark:bg-green-900/20', 
      textColor: 'text-green-600' 
    },
    { 
      key: 'sync', 
      icon: '📊', 
      label: '数据同步', 
      value: '实时', 
      bgColor: 'bg-blue-50 dark:bg-blue-900/20', 
      textColor: 'text-blue-600' 
    },
    { 
      key: 'security', 
      icon: '🔒', 
      label: '安全状态', 
      value: '良好', 
      bgColor: 'bg-purple-50 dark:bg-purple-900/20', 
      textColor: 'text-purple-600' 
    }
  ] as const,

  // 最近活动配置
  RECENT_ACTIVITIES: {
    limit: 5,
    emptyState: {
      icon: Activity,
      message: '暂无活动记录'
    }
  },

  // 系统提示配置
  SYSTEM_ALERTS: {
    initialization: {
      title: '系统初始化',
      message: '检测到系统为新安装，建议先创建用户和角色配置。',
      actionText: '立即配置',
      action: 'users'
    }
  }
} as const;

// 类型导出
export type StatCardKey = typeof DASHBOARD_CONFIG.STAT_CARDS[number]['key'];
export type QuickActionKey = typeof DASHBOARD_CONFIG.QUICK_ACTIONS[number]['key'];
export type SystemStatusKey = typeof DASHBOARD_CONFIG.SYSTEM_STATUS[number]['key'];
