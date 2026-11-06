import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Switch,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';
import api, { usePolling } from '../utils/api';

const TaskLogsModal = ({ task, onClose }) => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [follow, setFollow] = useState(true);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const load = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    try {
      setLogs(await api.taskLogs(task.id));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [task]);

  useEffect(() => {
    setLogs('');
    setError('');
  }, [task]);

  usePolling(load, 3000, !!task && follow);

  useEffect(() => {
    if (follow) endRef.current?.scrollIntoView({ block: 'end' });
  }, [logs, follow]);

  const copy = () =>
    navigator.clipboard.writeText(logs).then(
      () => toast.success('Logs copied'),
      () => toast.error('Clipboard is not available')
    );

  const download = () => {
    const url = URL.createObjectURL(new Blob([logs], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.name}-${new Date().toISOString().slice(0, 19)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={!!task} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="flex justify-between items-center">
        Logs · {task?.name}
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box className="px-6 pb-2 flex justify-between items-center">
        <FormControlLabel
          control={<Switch checked={follow} onChange={(e) => setFollow(e.target.checked)} />}
          label="Follow (refresh every 3 s)"
        />
        <Box>
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={load} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Copy">
            <span>
              <IconButton onClick={copy} disabled={!logs}>
                <ContentCopyIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download">
            <span>
              <IconButton onClick={download} disabled={!logs}>
                <DownloadIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      {loading && !logs ? <LinearProgress /> : <Box sx={{ height: 4 }} />}
      <DialogContent sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        <pre className="m-0 p-4 font-mono text-xs leading-5 whitespace-pre-wrap break-all bg-gray-900 text-gray-100 min-h-[200px] max-h-[60vh] overflow-auto">
          {logs || (!loading && !error ? 'No output yet.' : '')}
          <span ref={endRef} />
        </pre>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

TaskLogsModal.propTypes = {
  task: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }),
  onClose: PropTypes.func.isRequired,
};

export default TaskLogsModal;
