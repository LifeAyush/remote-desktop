import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, ChevronLeft, List, Plus, Server, Terminal } from 'lucide-react';

const navItems = [
  { path: '/monitor', icon: BarChart2, label: 'Monitoring', end: true },
  { path: '/tasks', icon: List, label: 'Containers', end: true },
  { path: '/tasks/new', icon: Plus, label: 'New Container', end: true },
  { path: '/terminal', icon: Terminal, label: 'Terminal', end: true },
];

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`${expanded ? 'w-60' : 'w-16'} relative shrink-0 flex flex-col bg-gray-800 text-white transition-all duration-200 border-r border-gray-700`}
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-700">
        <div className="h-8 w-8 shrink-0 bg-blue-600 rounded-md flex items-center justify-center">
          <Server size={18} />
        </div>
        {expanded && <span className="ml-3 font-semibold">Remote Desktop</span>}
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(({ path, icon: Icon, label, end }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={end}
                title={expanded ? undefined : label}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />
                {expanded && <span className="ml-3">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute -right-3 top-20 bg-gray-800 rounded-full p-1 border border-gray-600 hover:bg-gray-700"
      >
        <ChevronLeft size={14} className={`transition-transform ${expanded ? '' : 'rotate-180'}`} />
      </button>
    </aside>
  );
};

export default Sidebar;
