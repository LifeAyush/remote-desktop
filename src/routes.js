import { Navigate } from 'react-router-dom';
import MonitorPage from './pages/MonitorPage';
import TasksPage from './pages/TasksPage';
import TerminalPage from './pages/TerminalPage';
import CreateTaskPage from './pages/CreateTaskPage';

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
    path: '*',
    element: <Navigate to="/monitor" replace />
  }
];

export default routes;