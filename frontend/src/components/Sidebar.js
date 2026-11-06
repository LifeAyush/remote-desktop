import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart2, 
  List, 
  Terminal, 
  Plus,
  Settings,
  Server,
  HelpCircle,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);
  
  const navItems = [
    { 
      path: '/monitor', 
      icon: <BarChart2 size={20} />, 
      label: 'Monitoring', 
      exact: true 
    },
    { 
      path: '/tasks', 
      icon: <List size={20} />, 
      label: 'Tasks', 
      exact: false 
    },
    { 
      path: '/terminal', 
      icon: <Terminal size={20} />, 
      label: 'Terminal', 
      exact: false 
    },
    { 
      path: '/create-task', 
      icon: <Plus size={20} />, 
      label: 'Create Task', 
      exact: false 
    },
  ];
  
  const secondaryNavItems = [
    { 
      path: '/settings', 
      icon: <Settings size={20} />, 
      label: 'Settings', 
      exact: false 
    },
    { 
      path: '/servers', 
      icon: <Server size={20} />, 
      label: 'Servers', 
      exact: false 
    },
    { 
      path: '/help', 
      icon: <HelpCircle size={20} />, 
      label: 'Help', 
      exact: false 
    },
  ];

  return (
    <aside 
      className={`${
        expanded ? 'w-64' : 'w-20'
      } flex flex-col bg-gray-800 text-white transition-all duration-300 ease-in-out border-r border-gray-700 shadow-lg`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
            <Server size={18} className="text-white" />
          </div>
          {expanded && (
            <span className="ml-2 text-xl font-bold">RDC</span>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {expanded && (
                  <span className="ml-3">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        
        {/* Divider */}
        <div className="my-4 border-t border-gray-700" />
        
        {/* Secondary Navigation */}
        <ul className="space-y-1 px-3">
          {secondaryNavItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md transition-colors
                  ${isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {expanded && (
                  <span className="ml-3">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-700">
        <button 
          className="w-full flex items-center justify-center px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <LogOut size={20} />
          {expanded && <span className="ml-2">Logout</span>}
        </button>
      </div>
      
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-20 bg-gray-800 rounded-full p-1 border border-gray-700 focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-white transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
};

export default Sidebar;