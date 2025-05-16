import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TaskTable from '../components/TaskTable';
import TaskLogsModal from '../components/TaskLogsModal';
import { usePolling } from '../utils/usePolling';
import { fetchContainers, startContainer, stopContainer, restartContainer, deleteContainer, fetchContainerLogs } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [logsModal, setLogsModal] = useState({ open: false, taskId: null, taskName: null });
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Fetch container data
  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await fetchContainers();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch containers:', error);
      showToast('Failed to fetch containers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Setup polling to refresh container data
  const { startPolling, stopPolling } = usePolling(loadContainers, 5000);

  useEffect(() => {
    loadContainers();
    startPolling();
    
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle container actions
  const handleViewLogs = (id) => {
    const task = tasks.find(t => t.id === id);
    setLogsModal({
      open: true,
      taskId: id,
      taskName: task ? task.name : null
    });
  };

  const handleStartContainer = async (id) => {
    try {
      await startContainer(id);
      showToast('Container started successfully', 'success');
      loadContainers(); // Refresh container list
    } catch (error) {
      console.error('Failed to start container:', error);
      showToast('Failed to start container', 'error');
    }
  };

  const handleStopContainer = async (id) => {
    try {
      await stopContainer(id);
      showToast('Container stopped successfully', 'success');
      loadContainers(); // Refresh container list
    } catch (error) {
      console.error('Failed to stop container:', error);
      showToast('Failed to stop container', 'error');
    }
  };

  const handleRestartContainer = async (id) => {
    try {
      await restartContainer(id);
      showToast('Container restarted successfully', 'success');
      loadContainers(); // Refresh container list
    } catch (error) {
      console.error('Failed to restart container:', error);
      showToast('Failed to restart container', 'error');
    }
  };

  const handleDeleteContainer = async (id) => {
    // TODO: add a confirmation dialog here
    try {
      await deleteContainer(id);
      showToast('Container deleted successfully', 'success');
      loadContainers(); // Refresh container list
    } catch (error) {
      console.error('Failed to delete container:', error);
      showToast('Failed to delete container', 'error');
    }
  };

  const handleFetchLogs = async (id) => {
    try {
      return await fetchContainerLogs(id);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      throw error;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.image.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'running' && task.status.toLowerCase().includes('running')) ||
      (statusFilter === 'stopped' && task.status.toLowerCase().includes('exited')) ||
      (statusFilter === 'other' && 
        !task.status.toLowerCase().includes('running') && 
        !task.status.toLowerCase().includes('exited'));
        
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 h-full">
      <Box className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Typography variant="h4" component="h1">
          Task Manager
        </Typography>
        
        <Box className="flex gap-2">
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadContainers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks/create')}
          >
            Create Task
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} className="p-4 mb-6 dark:bg-gray-800">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, image, or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="stopped">Stopped</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} className="flex items-center">
            <Box className="text-sm text-gray-600 dark:text-gray-300">
              {filteredTasks.length} container{filteredTasks.length !== 1 ? 's' : ''} found
              {statusFilter !== 'all' && (
                <Chip 
                  label={`Status: ${statusFilter}`} 
                  onDelete={() => setStatusFilter('all')}
                  size="small"
                  className="ml-2"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} className="overflow-hidden">
        <TaskTable 
          tasks={filteredTasks}
          loading={loading}
          onViewLogs={handleViewLogs}
          onStart={handleStartContainer}
          onStop={handleStopContainer}
          onRestart={handleRestartContainer}
          onDelete={handleDeleteContainer}
        />
      </Paper>

      <TaskLogsModal 
        open={logsModal.open}
        onClose={() => setLogsModal({ ...logsModal, open: false })}
        taskId={logsModal.taskId}
        taskName={logsModal.taskName}
        fetchLogs={handleFetchLogs}
      />
    </div>
  );
};

export default TasksPage;