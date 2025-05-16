import { Navigate } from 'react-router-dom';
import MonitorPage from './pages/MonitorPage';
import TasksPage from './pages/TasksPage';
import TerminalPage from './pages/TerminalPage';
import CreateTaskPage from './pages/CreateTaskPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import ServersPage from './pages/ServersPage';

const routes = [
  {
    path: '/',
    element: <Navigate to="/monitor" replace />
  },
  {
    path: '/monitor',
    element: <MonitorPage />
  },
  {
    path: '/tasks',
    element: <TasksPage />
  },
  {
    path: '/terminal',
    element: <TerminalPage />
  },
  {
    path: '/create-task',
    element: <CreateTaskPage />
  },
  {
    path: '/settings',
    element: <SettingsPage />
  },
  {
    path: '/help',
    element: <HelpPage />
  },
  {
    path: '/servers',
    element: <ServersPage />
  },
  {
    path: '*',
    element: <Navigate to="/monitor" replace />
  }
];

export default routes;