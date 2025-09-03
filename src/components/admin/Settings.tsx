import React, { useState, useCallback, useMemo } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Bell, 
  Info, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { LocalStorageManager } from './LocalStorageManager';
import type { RoleResourcesStore } from '../../types';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'security' | 'notifications' | 'about'>('general');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: true,
    darkMode: false,
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    maxLogEntries: 500,
    sessionTimeout: 30
  });

  const tabs = [
    { key: 'general', label: '常规设置', icon: Info },
    { key: 'data', label: '数据管理', icon: Database },
    { key: 'security', label: '安全设置', icon: Shield },
    { key: 'notifications', label: '通知设置', icon: Bell },
    { key: 'about', label: '关于系统', icon: Info }
  ];

  // 简化的数据统计 - 使用 useMemo 避免重复计算
  const systemStats = useMemo(() => {
    try {
      const roles = JSON.parse(localStorage.getItem('admin_roles_v1') || '[]');
      const users = JSON.parse(localStorage.getItem('admin_users_v1') || '[]');
      const logs = JSON.parse(localStorage.getItem('admin_action_logs_v1') || '[]');
      
      return {
        totalRoles: Array.isArray(roles) ? roles.length : 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalLogs: Array.isArray(logs) ? logs.length : 0,
        totalResources: 0, // 暂时设为0，避免复杂计算
        storageSize: 0 // 暂时设为0，避免复杂计算
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalRoles: 0,
        totalUsers: 0,
        totalLogs: 0,
        totalResources: 0,
        storageSize: 0
      };
    }
  }, [activeTab]); // 只在切换标签时重新计算

  // 导出数据
  const exportData = useCallback(() => {
    try {
      const data = {
        roles: JSON.parse(localStorage.getItem('admin_roles_v1') || '[]'),
        roleResources: JSON.parse(localStorage.getItem('admin_role_resources_v1') || '{}'),
        users: JSON.parse(localStorage.getItem('admin_users_v1') || '[]'),
        logs: JSON.parse(localStorage.getItem('admin_action_logs_v1') || '[]'),
        roleMeta: JSON.parse(localStorage.getItem('admin_role_meta_v1') || '{}'),
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败：' + error);
    }
  }, []);

  // 导入数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.roles) localStorage.setItem('admin_roles_v1', JSON.stringify(data.roles));
        if (data.roleResources) localStorage.setItem('admin_role_resources_v1', JSON.stringify(data.roleResources));
        if (data.users) localStorage.setItem('admin_users_v1', JSON.stringify(data.users));
        if (data.logs) localStorage.setItem('admin_action_logs_v1', JSON.stringify(data.logs));
        if (data.roleMeta) localStorage.setItem('admin_role_meta_v1', JSON.stringify(data.roleMeta));
        
        alert('数据导入成功！页面将刷新以应用更改。');
        window.location.reload();
      } catch (error) {
        alert('数据导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  // 清理数据
  const clearData = (type: string) => {
    if (!confirm(`确定要清理所有${type}数据吗？此操作不可撤销！`)) return;
    
    try {
      switch (type) {
        case 'logs':
          localStorage.removeItem('admin_action_logs_v1');
          break;
        case 'all':
          localStorage.removeItem('admin_roles_v1');
          localStorage.removeItem('admin_role_resources_v1');
          localStorage.removeItem('admin_users_v1');
          localStorage.removeItem('admin_action_logs_v1');
          localStorage.removeItem('admin_role_meta_v1');
          break;
      }
      
      alert(`${type === 'all' ? '所有' : type}数据已清理！页面将刷新。`);
      window.location.reload();
    } catch (error) {
      alert('清理失败：' + error);
    }
  };

  // 重置设置
  const resetSettings = () => {
    if (!confirm('确定要重置所有设置吗？')) return;
    setSettings({
      autoSave: true,
      notifications: true,
      darkMode: false,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      maxLogEntries: 500,
      sessionTimeout: 30
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">系统设置</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">管理系统配置和偏好设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边栏导航 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <nav className="p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.key}>
                      <button
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                          activeTab === tab.key
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon size={20} className="mr-3" />
                        {tab.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              {/* 常规设置 */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">常规设置</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">自动保存</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">自动保存表单数据</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoSave}
                          onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">深色模式</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">使用深色主题</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.darkMode}
                          onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">语言设置</label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({...settings, language: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                      >
                        <option value="zh-CN">简体中文</option>
                        <option value="en-US">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">时区设置</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                      >
                        <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                        <option value="UTC">协调世界时 (UTC)</option>
                        <option value="America/New_York">纽约时间 (UTC-5)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 数据管理 */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">数据管理</h2>
                  
                  {/* 数据统计 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">角色数量</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.totalRoles}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">用户数量</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.totalUsers}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">资源数量</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.totalResources}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">存储大小</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.storageSize} KB</p>
                    </div>
                  </div>

                  {/* 数据操作 */}
                  <div className="space-y-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">数据备份与恢复</h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={exportData}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download size={16} className="mr-2" />
                          导出数据
                        </button>
                        <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                          <Upload size={16} className="mr-2" />
                          导入数据
                          <input
                            type="file"
                            accept=".json"
                            onChange={importData}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">数据清理</h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => clearData('logs')}
                          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          <Trash2 size={16} className="mr-2" />
                          清理日志
                        </button>
                        <button
                          onClick={() => clearData('all')}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} className="mr-2" />
                          清理所有数据
                        </button>
                      </div>
                    </div>

                    {/* 本地文件系统管理 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">本地文件系统管理</h3>
                      <LocalStorageManager 
                        roleResources={JSON.parse(localStorage.getItem('admin_role_resources_v1') || '{}')}
                        onImportSuccess={(resources: RoleResourcesStore) => {
                          localStorage.setItem('admin_role_resources_v1', JSON.stringify(resources));
                          alert('资源数据已更新！');
                        }}
                      />
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">数据清理</h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => clearData('logs')}
                          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          <Trash2 size={16} className="mr-2" />
                          清理日志
                        </button>
                        <button
                          onClick={() => clearData('all')}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} className="mr-2" />
                          清理所有数据
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 安全设置 */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">安全设置</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">管理员密码</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="输入新密码"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 bg-white dark:bg-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">会话超时 (分钟)</label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                        min="5"
                        max="120"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">最大日志条目数</label>
                      <input
                        type="number"
                        value={settings.maxLogEntries}
                        onChange={(e) => setSettings({...settings, maxLogEntries: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
                        min="100"
                        max="10000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 通知设置 */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">通知设置</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">系统通知</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">接收系统重要通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications}
                          onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 关于系统 */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">关于系统</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">系统信息</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">版本号:</span>
                          <span className="text-gray-900 dark:text-gray-100">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">构建时间:</span>
                          <span className="text-gray-900 dark:text-gray-100">2024-01-01</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">运行环境:</span>
                          <span className="text-gray-900 dark:text-gray-100">浏览器本地存储</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">技术栈</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">前端框架:</span>
                          <span className="text-gray-900 dark:text-gray-100">React + TypeScript</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">样式框架:</span>
                          <span className="text-gray-900 dark:text-gray-100">Tailwind CSS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">构建工具:</span>
                          <span className="text-gray-900 dark:text-gray-100">Vite</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">图标库:</span>
                          <span className="text-gray-900 dark:text-gray-100">Lucide React</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 保存按钮 */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <button
                    onClick={resetSettings}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    重置设置
                  </button>
                  <button
                    onClick={() => alert('设置已保存')}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} className="mr-2" />
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};