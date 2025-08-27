import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AdminHeader } from './Header';

interface LayoutProps {
  renderContent: (activeMenu: string, onMenuChange: (menu: string) => void) => React.ReactNode;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AdminLayout: React.FC<LayoutProps> = ({ renderContent, isDarkMode, onToggleDarkMode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 固定侧边栏 */}
      <div className="fixed left-0 top-0 z-50">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
        />
      </div>

      {/* 主内容区域 */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: isCollapsed ? '64px' : '256px' }}
      >
        <AdminHeader
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          onLogout={() => alert('已退出登录（示例）')}
          user={{ name: '管理员', role: 'Admin' }}
        />

        <main className="p-6 overflow-y-auto">
          {renderContent(activeMenu, setActiveMenu)}
        </main>
      </div>
    </div>
  );
};


