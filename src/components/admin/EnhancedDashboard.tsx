import React, { useCallback } from 'react';
import { TrendingUp, Clock, Activity } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DASHBOARD_CONFIG } from '../../constants/dashboard';
import { 
  formatTimeDisplay, 
  calculateHealthScore, 
  getSystemStatusDescription 
} from '../../utils/dashboard';

// 类型定义
interface DashboardProps {
  onMenuChange?: (menu: string) => void;
}

// 统计卡片组件
const StatCard: React.FC<{
  config: typeof DASHBOARD_CONFIG.STAT_CARDS[number];
  value: number;
  onClick?: () => void;
}> = React.memo(({ config, value, onClick }) => {
  const IconComponent = config.icon;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={onClick}
      hover
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {config.trend && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
                <TrendingUp size={14} className="mr-1" />
                {config.trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${config.color}`}>
            <IconComponent size={24} className={config.textColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// 最近活动项组件
const RecentActivityItem: React.FC<{ log: { action: string; detail?: string; target?: string; ts: number } }> = React.memo(({ log }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
      <Activity size={16} className="text-blue-600 dark:text-blue-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {log.action}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {log.detail || log.target || '系统操作'}
      </p>
    </div>
    <div className="text-xs text-gray-400 dark:text-gray-500">
      <Clock size={12} className="inline mr-1" />
      {formatTimeDisplay(log.ts)}
    </div>
  </div>
));

// 快捷操作按钮组件
const QuickActionButton: React.FC<{
  config: typeof DASHBOARD_CONFIG.QUICK_ACTIONS[number];
  onAction: (action: string) => void;
}> = React.memo(({ config, onAction }) => {
  const IconComponent = config.icon;
  
  return (
    <Button
      variant="outline"
      onClick={() => onAction(config.action)}
      leftIcon={<IconComponent size={16} />}
      fullWidth
    >
      {config.label}
    </Button>
  );
});

// 页面标题组件
const DashboardHeader: React.FC<{ 
  totalUsers: number; 
  healthScore: number;
  statusDescription: string;
}> = React.memo(({ totalUsers, healthScore, statusDescription }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        系统概览
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        欢迎使用后台管理系统
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <Badge variant="success">系统正常</Badge>
      <Badge variant="primary">在线用户: {totalUsers}</Badge>
      <Badge variant={healthScore >= 70 ? 'success' : healthScore >= 50 ? 'warning' : 'error'}>
        健康度: {statusDescription}
      </Badge>
    </div>
  </div>
));

// 统计卡片网格组件
const StatsGrid: React.FC<{ 
  stats: { totalRoles: number; totalUsers: number; totalResources: number; todayOperations: number }; 
  onQuickAction: (action: string) => void 
}> = React.memo(({ stats, onQuickAction }) => {
  const getStatValue = (key: string): number => {
    const valueMap: Record<string, number> = {
      roles: stats.totalRoles,
      users: stats.totalUsers,
      resources: stats.totalResources,
      operations: stats.todayOperations
    };
    return valueMap[key] || 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {DASHBOARD_CONFIG.STAT_CARDS.map((config) => (
        <StatCard
          key={config.key}
          config={config}
          value={getStatValue(config.key)}
          onClick={() => onQuickAction(config.action)}
        />
      ))}
    </div>
  );
});

// 快捷操作网格组件
const QuickActionsGrid: React.FC<{ onQuickAction: (action: string) => void }> = React.memo(({ onQuickAction }) => (
  <Card>
    <CardHeader>
      <h2 className="text-lg font-semibold">快捷操作</h2>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DASHBOARD_CONFIG.QUICK_ACTIONS.map((config) => (
          <QuickActionButton
            key={config.key}
            config={config}
            onAction={onQuickAction}
          />
        ))}
      </div>
    </CardContent>
  </Card>
));

// 最近活动组件
const RecentActivities: React.FC<{ logs: { action: string; detail?: string; target?: string; ts: number }[] }> = React.memo(({ logs }) => (
  <Card>
    <CardHeader>
      <h2 className="text-lg font-semibold">最近活动</h2>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <RecentActivityItem key={index} log={log} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity size={48} className="mx-auto mb-4 opacity-50" />
            <p>{DASHBOARD_CONFIG.RECENT_ACTIVITIES.emptyState.message}</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));

// 系统状态组件
const SystemStatus: React.FC<{ systemHealth: { isRunning: boolean; dataSync: boolean; securityStatus: boolean } }> = React.memo(({ systemHealth }) => (
  <Card>
    <CardHeader>
      <h2 className="text-lg font-semibold">系统状态</h2>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DASHBOARD_CONFIG.SYSTEM_STATUS.map((item) => {
          const isHealthy = item.key === 'running' ? systemHealth.isRunning :
                           item.key === 'sync' ? systemHealth.dataSync :
                           item.key === 'security' ? systemHealth.securityStatus : false;
          return (
            <div key={item.key} className={`text-center p-4 ${item.bgColor} rounded-lg`}>
              <div className={`text-2xl font-bold ${item.textColor}`}>
                {isHealthy ? item.icon : '⚠️'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {isHealthy ? item.value : '异常'}
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
));

// 系统提示组件
const SystemAlert: React.FC<{ 
  totalUsers: number; 
  onQuickAction: (action: string) => void;
  healthScore: number;
}> = React.memo(({ totalUsers, onQuickAction, healthScore }) => {
  // 如果系统健康且用户数量正常，不显示提示
  if (totalUsers > 0 && healthScore >= 70) return null;

  // 根据具体情况显示不同的提示
  let alertType: 'error' | 'warning' | 'info' = 'warning';
  let alertTitle = '系统初始化';
  let alertMessage = '检测到系统为新安装，建议先创建用户和角色配置。';
  let actionText = '立即配置';
  let actionTarget = 'users';

  if (totalUsers === 0) {
    alertType = 'warning';
    alertTitle = '需要创建用户';
    alertMessage = '系统尚未创建任何用户，请先创建管理员用户以开始使用系统。';
    actionText = '创建用户';
    actionTarget = 'users';
  } else if (healthScore < 50) {
    alertType = 'error';
    alertTitle = '系统配置不完整';
    alertMessage = '系统健康度较低，建议检查用户、角色和权限配置。';
    actionText = '检查配置';
    actionTarget = 'settings';
  } else if (healthScore < 70) {
    alertType = 'warning';
    alertTitle = '系统需要优化';
    alertMessage = '系统运行正常但配置可以进一步完善，建议添加更多用户和角色。';
    actionText = '优化配置';
    actionTarget = 'roles';
  }
  
  return (
    <Alert
      type={alertType}
      title={alertTitle}
      closable
    >
      {alertMessage}
      <Button
        variant="primary"
        size="sm"
        className="ml-4"
        onClick={() => onQuickAction(actionTarget)}
      >
        {actionText}
      </Button>
    </Alert>
  );
});

// 主组件
export const EnhancedDashboard: React.FC<DashboardProps> = ({ onMenuChange }) => {
  // 使用自定义Hook获取数据
  const { stats } = useDashboardData();

  // 计算系统健康度
  const healthScore = calculateHealthScore(stats);
  const statusDescription = getSystemStatusDescription(healthScore);

  // 快捷操作点击处理
  const handleQuickAction = useCallback((action: string) => {
    if (onMenuChange) {
      onMenuChange(action);
    }
  }, [onMenuChange]);

  return (
    <div className="space-y-6">
      <DashboardHeader 
        totalUsers={stats.totalUsers} 
        healthScore={healthScore}
        statusDescription={statusDescription}
      />
      <StatsGrid stats={stats} onQuickAction={handleQuickAction} />
      <QuickActionsGrid onQuickAction={handleQuickAction} />
      <RecentActivities logs={stats.recentLogs} />
      <SystemStatus systemHealth={stats.systemHealth} />
      <SystemAlert 
        totalUsers={stats.totalUsers} 
        onQuickAction={handleQuickAction}
        healthScore={healthScore}
      />
    </div>
  );
};
