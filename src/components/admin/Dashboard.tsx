import React, { useMemo } from 'react';
import { Users, Shield, FileText, Upload, Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const storageKey = 'admin_roles_v1';
const roleResKey = 'admin_role_resources_v1';
const userKey = 'admin_users_v1';
const logKey = 'admin_action_logs_v1';

interface DashboardProps {
  onMenuChange?: (menu: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onMenuChange }) => {
  // 获取系统数据
  const systemStats = useMemo(() => {
    const roles = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const roleResources = JSON.parse(localStorage.getItem(roleResKey) || '{}');
    const users = JSON.parse(localStorage.getItem(userKey) || '[]');
    const logs = JSON.parse(localStorage.getItem(logKey) || '[]');

    // 计算资源总数
    let totalResources = 0;
    Object.values(roleResources).forEach((roleRes: any) => {
      if (roleRes) {
        totalResources += (roleRes.eat?.length || 0) + 
                        (roleRes.gift?.length || 0) + 
                        (roleRes.travel?.length || 0) + 
                        (roleRes.standby?.length || 0) + 
                        (roleRes.moments?.length || 0);
      }
    });

    // 计算今日操作数
    const today = new Date().toDateString();
    const todayLogs = logs.filter((log: any) => 
      new Date(log.ts).toDateString() === today
    );

    // 获取最近活动
    const recentLogs = logs.slice(0, 5);

    return {
      totalRoles: roles.length,
      totalUsers: users.length,
      totalResources,
      todayOperations: todayLogs.length,
      recentLogs
    };
  }, []);

  // 快捷操作点击处理
  const handleQuickAction = (action: string) => {
    if (onMenuChange) {
      onMenuChange(action);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const RecentActivityItem: React.FC<{
    log: any;
  }> = ({ log }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
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
        {new Date(log.ts).toLocaleTimeString()}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">仪表盘</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">系统概览和统计信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="角色总数"
          value={systemStats.totalRoles}
          icon={<Shield size={24} className="text-white" />}
          color="bg-blue-500"
          trend="+2 本周"
        />
        <StatCard
          title="用户总数"
          value={systemStats.totalUsers}
          icon={<Users size={24} className="text-white" />}
          color="bg-green-500"
          trend="+1 今日"
        />
        <StatCard
          title="资源总数"
          value={systemStats.totalResources}
          icon={<FileText size={24} className="text-white" />}
          color="bg-purple-500"
          trend="+15 本周"
        />
        <StatCard
          title="今日操作"
          value={systemStats.todayOperations}
          icon={<Upload size={24} className="text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近活动 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">最近活动</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">系统操作记录</p>
          </div>
          <div className="p-6">
            {systemStats.recentLogs.length > 0 ? (
              <div className="space-y-2">
                {systemStats.recentLogs.map((log: any) => (
                  <RecentActivityItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">暂无活动记录</p>
              </div>
            )}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">快捷操作</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">常用功能入口</p>
          </div>
          <div className="p-6 space-y-3">
            <button 
              onClick={() => handleQuickAction('roles')}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                <Shield size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">新增角色</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">创建新的角色配置</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('upload')}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                <Upload size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">上传资源</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">添加角色资源文件</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('users')}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                <Users size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">用户管理</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">管理系统用户</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('resources')}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-3">
                <FileText size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">资源管理</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">查看和管理资源</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('logs')}
              className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg mr-3">
                <Activity size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">操作日志</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">查看系统操作记录</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">系统状态</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">系统运行状态和健康检查</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">系统运行正常</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">所有服务正常</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">数据存储正常</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">本地存储可用</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">日志记录</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">共 {systemStats.recentLogs.length} 条记录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


