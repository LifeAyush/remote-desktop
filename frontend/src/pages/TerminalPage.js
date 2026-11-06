import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, MenuItem, Paper, TextField, Typography } from '@mui/material';
import Terminal from '../components/Terminal';
import { useAuth } from '../contexts/AuthContext';
import api, { wsUrl } from '../utils/api';

const STATUS_COLOR = { connecting: 'warning', connected: 'success', closed: 'default' };

const TerminalPage = () => {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(params.get('task') || '');
  const [session, setSession] = useState(null); // { id, key }
  const [status, setStatus] = useState('closed');

  useEffect(() => {
    api
      .tasks()
      .then((all) => setTasks(all.filter((t) => t.status === 'running')))
      .catch((err) => setError(err.message));
  }, []);

  // Opened from the containers page with ?task=…: connect straight away.
  useEffect(() => {
    const id = params.get('task');
    if (id && tasks.some((t) => t.id === id) && !session) {
      setSession({ id, key: Date.now() });
    }
  }, [params, tasks, session]);

  const current = useMemo(() => tasks.find((t) => t.id === session?.id), [tasks, session]);

  const connect = () => {
    setParams({ task: selected });
    setSession({ id: selected, key: Date.now() });
  };

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {error && <Alert severity="error">Could not load containers: {error}</Alert>}
      <Paper elevation={1} className="p-4 flex flex-wrap gap-3 items-center">
        <TextField
          select
          size="small"
          label="Running container"
          value={tasks.some((t) => t.id === selected) ? selected : ''}
          onChange={(e) => setSelected(e.target.value)}
          sx={{ minWidth: 280 }}
          helperText={tasks.length ? ' ' : 'No running containers'}
        >
          {tasks.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name} <span className="ml-2 text-xs text-gray-500 font-mono">{t.image}</span>
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={connect} disabled={!selected || !tasks.some((t) => t.id === selected)} sx={{ mb: 2.5 }}>
          {session ? 'Reconnect' : 'Connect'}
        </Button>
        {session && (
          <Button variant="outlined" onClick={() => setSession(null)} sx={{ mb: 2.5 }}>
            Disconnect
          </Button>
        )}
        {session && (
          <Box className="ml-auto flex items-center gap-2 mb-5">
            <Typography variant="body2">{current?.name || session.id}</Typography>
            <Chip size="small" label={status} color={STATUS_COLOR[status]} />
          </Box>
        )}
      </Paper>
      <Paper elevation={1} className="flex-1 min-h-[400px] overflow-hidden" sx={{ bgcolor: '#111827' }}>
        {session ? (
          <Terminal key={session.key} socketUrl={wsUrl(`/ws/terminal/${session.id}`)} token={token} onStatus={setStatus} />
        ) : (
          <Box className="h-full flex items-center justify-center text-gray-400 text-sm p-8 text-center">
            Pick a running container to open a shell inside it (bash if present, otherwise sh).
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default TerminalPage;
