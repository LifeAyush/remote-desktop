import { Navigate } from 'react-router-dom';
import MonitorPage from './pages/MonitorPage';
import TasksPage from './pages/TasksPage';
import TerminalPage from './pages/TerminalPage';
import CreateTaskPage from './pages/CreateTaskPage';

export const pages = [
  { path: '/monitor', title: 'System Monitoring' },
  { path: '/tasks', title: 'Containers' },
  { path: '/tasks/new', title: 'New Container' },
  { path: '/terminal', title: 'Terminal' },
];

const routes = [
  { path: '/', element: <Navigate to="/monitor" replace /> },
  { path: '/monitor', element: <MonitorPage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/tasks/new', element: <CreateTaskPage /> },
  { path: '/terminal', element: <TerminalPage /> },
  { path: '*', element: <Navigate to="/monitor" replace /> },
];

export default routes;
