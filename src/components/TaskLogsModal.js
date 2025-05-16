import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { usePolling } from '../utils/usePolling';
import { ThemeContext } from '../contexts/ThemeContext';

const TaskLogsModal = ({ 
  open, 
  onClose, 
  taskId, 
  taskName, 
  fetchLogs
}) => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState('');
  const logsEndRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  const getLogs = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const logsData = await fetchLogs(taskId);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to fetch logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set up polling when autoRefresh is enabled
  const { startPolling, stopPolling } = usePolling(getLogs, 3000);

  useEffect(() => {
    if (open && taskId) {
      getLogs();
    } else {
      // Reset state when modal is closed
      setLogs('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  useEffect(() => {
    if (autoRefresh) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs)
      .then(() => {
        // Could show a toast notification here
        console.log('Logs copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy logs:', err);
      });
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName || taskId}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        className: darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }}
    >
      <DialogTitle className="flex justify-between items-center">
        <Typography variant="h6" component="div">
          Logs: {taskName || taskId}
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose} 
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box className="px-6 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <FormControlLabel
          control={
            <Switch
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              color="primary"
            />
          }
          label="Auto-refresh logs"
        />
        
        <Box className="flex items-center gap-2">
          <Tooltip title="Refresh logs">
            <IconButton onClick={getLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Copy to clipboard">
            <IconButton onClick={handleCopyLogs} disabled={!logs}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download logs">
            <IconButton onClick={handleDownloadLogs} disabled={!logs}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <DialogContent 
        className={`p-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
      >
        {loading && !logs && (
          <Box className="flex justify-center items-center p-8">
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box className="p-4 text-red-500">
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        {!loading && !error && !logs && (
          <Box className="p-8 text-center">
            <Typography variant="body1" color="textSecondary">
              No logs available for this container
            </Typography>
          </Box>
        )}
        
        {logs && (
          <Box 
            className={`p-4 font-mono text-sm overflow-auto whitespace-pre max-h-[60vh] ${
              darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
            }`}
          >
            {logs}
            <div ref={logsEndRef} />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions className="p-4">
        {loading && (
          <Box className="mr-auto flex items-center gap-2">
            <CircularProgress size={16} />
            <Typography variant="body2" color="textSecondary">
              Fetching logs...
            </Typography>
          </Box>
        )}
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

TaskLogsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskId: PropTypes.string,
  taskName: PropTypes.string,
  fetchLogs: PropTypes.func.isRequired
};

export default TaskLogsModal;