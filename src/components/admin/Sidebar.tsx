import React from 'react';
import { 
  Users, 
  Shield, 
  FileText, 
  Upload, 
  Settings, 
  BarChart3,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: BarChart3 },
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'roles', label: '角色管理', icon: Shield },
  { key: 'resources', label: '资源管理', icon: FileText },
  { key: 'upload', label: '文件上传', icon: Upload },
  { key: 'logs', label: '操作日志', icon: FileText },
  { key: 'settings', label: '系统设置', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  activeMenu,
  onMenuChange
}) => {
  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen fixed left-0 top-0 z-50`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold">后台管理</h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.key;
            
            return (
              <li key={item.key}>
                <button
                  onClick={() => onMenuChange(item.key)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <div className="text-sm text-gray-400">
            <p>版本 1.0.0</p>
            <p>© 2024 后台管理系统</p>
          </div>
        )}
      </div>
    </div>
  );
};
