import React from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { Chip, Tooltip } from '@mui/material';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { pages } from '../routes';

const Header = () => {
  const { pathname } = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const { session, logout } = useAuth();
  const page = pages.find((p) => matchPath(p.path, pathname));

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10 h-16 shrink-0 flex justify-between items-center px-6">
      <h1 className="text-xl font-semibold">{page ? page.title : 'Remote Desktop'}</h1>
      <div className="flex items-center gap-3">
        {session && (
          <Tooltip title={session.runtime === 'demo' ? 'Demo runtime: containers are simulated' : 'Connected to the Docker engine'}>
            <Chip
              size="small"
              color={session.runtime === 'demo' ? 'warning' : 'success'}
              label={`${session.host} · ${session.runtime}`}
            />
          </Tooltip>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
