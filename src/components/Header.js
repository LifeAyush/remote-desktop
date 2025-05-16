import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('monitor')) return 'System Monitoring';
    if (path.includes('tasks')) return 'Task Manager';
    if (path.includes('terminal')) return 'SSH Terminal';
    if (path.includes('create-task')) return 'Create New Task';
    
    return 'Dashboard';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10 h-16">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          {getPageTitle()}
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-100 dark:bg-gray-700 text-sm rounded-md pl-10 pr-4 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white w-64"
            />
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-gray-400" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>
          
          {/* User Profile */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <span className="text-sm font-medium">AD</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;