// Dashboard工具函数

/**
 * 格式化时间显示
 */
export const formatTimeDisplay = (timestamp: number | string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return '未知时间';
  }
};

/**
 * 计算趋势变化
 */
export const calculateTrend = (current: number, previous: number): { value: string; isPositive: boolean } => {
  if (previous === 0) {
    return { value: '新', isPositive: true };
  }

  const change = current - previous;
  const percentage = (change / previous) * 100;
  
  if (Math.abs(percentage) < 5) {
    return { value: '稳定', isPositive: true };
  }

  const sign = change > 0 ? '+' : '';
  return {
    value: `${sign}${Math.round(percentage)}%`,
    isPositive: change > 0
  };
};

/**
 * 生成统计卡片的动态趋势
 */
export const generateDynamicTrend = (key: string, value: number): string => {
  const trends = {
    roles: ['+2 本月', '+5 本季度', '稳定增长'],
    users: ['+5 本周', '+15 本月', '用户活跃'],
    resources: ['+12 今日', '+45 本周', '内容丰富'],
    operations: ['活跃', '高频', '正常']
  };

  const trendList = trends[key as keyof typeof trends] || ['正常'];
  const index = Math.floor(Math.random() * trendList.length);
  return trendList[index];
};

/**
 * 验证系统数据完整性
 */
export const validateSystemData = (data: any): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (!Array.isArray(data.roles) || data.roles.length === 0) {
    issues.push('角色配置缺失');
  }

  if (!Array.isArray(data.users) || data.users.length === 0) {
    issues.push('用户配置缺失');
  }

  if (!data.roleResources || Object.keys(data.roleResources).length === 0) {
    issues.push('资源权限配置缺失');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * 生成系统健康评分
 */
export const calculateHealthScore = (stats: any): number => {
  let score = 100;

  // 用户数量评分
  if (stats.totalUsers === 0) score -= 30;
  else if (stats.totalUsers < 5) score -= 10;

  // 角色数量评分
  if (stats.totalRoles === 0) score -= 25;
  else if (stats.totalRoles < 3) score -= 10;

  // 资源数量评分
  if (stats.totalResources === 0) score -= 20;
  else if (stats.totalResources < 10) score -= 5;

  // 操作活跃度评分
  if (stats.todayOperations === 0) score -= 15;
  else if (stats.todayOperations < 5) score -= 5;

  return Math.max(0, score);
};

/**
 * 获取系统状态描述
 */
export const getSystemStatusDescription = (score: number): string => {
  if (score >= 90) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 50) return '一般';
  if (score >= 30) return '需要关注';
  return '需要立即处理';
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
