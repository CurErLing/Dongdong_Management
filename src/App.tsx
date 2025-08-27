import { useEffect, useCallback } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import { AdminLayout } from './components/admin/Layout';
import { Dashboard } from './components/admin/Dashboard';
import { RoleManager } from './components/admin/RoleManager';
import { ResourceManager } from './components/admin/ResourceManager';
import { UploadCenter } from './components/admin/UploadCenter';
import { UsersManager } from './components/admin/UsersManager';
import { Logs } from './components/admin/Logs';
import { Settings } from './components/admin/Settings';

function App() {
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  useEffect(() => {
    document.title = '后台管理系统';
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode(!isDarkMode), [isDarkMode, setIsDarkMode]);

  return (
    <AdminLayout
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      renderContent={(menu, onMenuChange) => {
        if (menu === 'dashboard') return <Dashboard onMenuChange={onMenuChange} />;
        if (menu === 'users') return <UsersManager />;
        if (menu === 'roles') return <RoleManager />;
        if (menu === 'resources') return <ResourceManager />;
        if (menu === 'upload') return <UploadCenter />;
        if (menu === 'logs') return <Logs />;
        if (menu === 'settings') return <Settings />;
        return <Dashboard onMenuChange={onMenuChange} />;
      }}
    />
  );
}

export default App;