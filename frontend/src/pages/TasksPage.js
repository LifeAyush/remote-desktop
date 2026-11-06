import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, MenuItem, Paper, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';
import TaskTable from '../components/TaskTable';
import TaskLogsModal from '../components/TaskLogsModal';
import ConfirmDialog from '../components/ConfirmDialog';
import api, { usePolling } from '../utils/api';

const PAST = { start: 'started', stop: 'stopped', restart: 'restarted', kill: 'killed', remove: 'removed' };
const NEEDS_CONFIRM = {
  kill: 'Kill sends SIGKILL. The process gets no chance to shut down cleanly.',
  remove: 'Remove deletes the container and its writable layer. This cannot be undone.',
};

const TasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [logsFor, setLogsFor] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    try {
      setTasks(await api.tasks());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  usePolling(load, 3000);

  const run = async (task, action) => {
    setConfirm(null);
    setBusyId(task.id);
    try {
      if (action === 'remove') await api.removeTask(task.id);
      else await api.taskAction(task.id, action);
      toast.success(`${task.name} ${PAST[action]}`);
      await load();
    } catch (err) {
      toast.error(`${task.name}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const onAction = (task, action) => (NEEDS_CONFIRM[action] ? setConfirm({ task, action }) : run(task, action));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (status === 'all' || (status === 'other' ? !['running', 'exited'].includes(t.status) : t.status === status)) &&
        (!q || [t.name, t.image, t.id].some((v) => v.toLowerCase().includes(q)))
    );
  }, [tasks, query, status]);

  const running = tasks.filter((t) => t.status === 'running').length;

  return (
    <div className="p-6 space-y-4">
      <Box className="flex flex-wrap gap-3 justify-between items-center">
        <Typography variant="body2" color="text.secondary">
          {tasks.length} containers · {running} running · refreshes every 3 s
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tasks/new')}>
          New container
        </Button>
      </Box>

      {error && <Alert severity="error">Could not load containers: {error}</Alert>}

      <Paper elevation={1}>
        <Box className="flex flex-wrap gap-3 p-4">
          <TextField
            size="small"
            placeholder="Search name, image or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: '1 1 280px' }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 160 }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="running">Running</MenuItem>
            <MenuItem value="exited">Exited</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Box>
        <TaskTable
          tasks={filtered}
          loading={loading}
          busyId={busyId}
          onAction={onAction}
          onViewLogs={setLogsFor}
          onOpenTerminal={(t) => navigate(`/terminal?task=${encodeURIComponent(t.id)}`)}
        />
      </Paper>

      <TaskLogsModal task={logsFor} onClose={() => setLogsFor(null)} />
      <ConfirmDialog
        open={!!confirm}
        title={confirm ? `${confirm.action === 'kill' ? 'Kill' : 'Remove'} ${confirm.task.name}?` : ''}
        message={confirm ? NEEDS_CONFIRM[confirm.action] : ''}
        confirmLabel={confirm?.action === 'kill' ? 'Kill' : 'Remove'}
        onConfirm={() => run(confirm.task, confirm.action)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
};

export default TasksPage;
