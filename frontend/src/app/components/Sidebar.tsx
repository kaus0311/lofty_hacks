import { useState, useEffect } from 'react';
import { Home, Users, TrendingUp, Activity, Sparkles, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'smart-plan', label: 'Smart Plan', icon: Sparkles },
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-all duration-300`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  A<span className="text-red-500">D</span>
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Action<span className="text-red-600">Desk</span>
              </h1>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mx-auto hover:opacity-80 transition-opacity"
          >
            <span className="text-white font-bold text-sm">
              A<span className="text-red-500">D</span>
            </span>
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 pt-0">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-rose-700 to-rose-800 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            K
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">Kaus</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">kaus@gmail.com</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
