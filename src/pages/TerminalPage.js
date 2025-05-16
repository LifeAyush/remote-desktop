import React, { useState } from 'react';
import Terminal from '../components/Terminal';
import { 
  Paper, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  TextField,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { API_BASE_URL } from '../utils/api';

const TerminalPage = () => {
  const [server, setServer] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');

  // Example server list - this would come from your API in a real implementation
  const servers = [
    { id: 'server1', name: 'Production Server', host: 'prod-server' },
    { id: 'server2', name: 'Staging Server', host: 'staging-server' },
    { id: 'server3', name: 'Development Server', host: 'dev-server' },
  ];

  const handleConnect = () => {
    if (server) {
      setIsConnected(true);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setServer('');
  };

  const getWebSocketUrl = () => {
    // Use custom endpoint if provided, otherwise use the selected server
    if (customEndpoint) {
      // Make sure it starts with ws:// or wss://
      if (!customEndpoint.startsWith('ws://') && !customEndpoint.startsWith('wss://')) {
        return `ws://${customEndpoint}/ssh`;
      }
      return `${customEndpoint}/ssh`;
    }
    
    // Convert HTTP/HTTPS to WS/WSS
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const selectedServer = servers.find(s => s.id === server);
    
    return `${wsProtocol}//${API_BASE_URL.replace(/^https?:\/\//, '')}/ssh/${selectedServer?.host || 'default'}`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <Box className="mb-6 flex justify-between items-center">
        <Typography variant="h4" component="h1" gutterBottom>
          SSH Terminal
        </Typography>
        <IconButton onClick={() => setShowSettings(!showSettings)} color="primary">
          <SettingsIcon />
        </IconButton>
      </Box>

      {showSettings && (
        <Paper elevation={3} className="mb-6 p-4 dark:bg-gray-800">
          <Typography variant="subtitle1" gutterBottom>
            Terminal Settings
          </Typography>
          <Box className="flex gap-4 flex-wrap">
            <TextField
              label="Custom WebSocket Endpoint"
              variant="outlined"
              size="small"
              fullWidth
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="ws://localhost:8000/ssh"
              helperText="Leave empty to use the default endpoint"
              className="mb-2"
            />
          </Box>
        </Paper>
      )}

      {!isConnected ? (
        <Paper elevation={3} className="p-4 mb-4 dark:bg-gray-800">
          <Typography variant="h6" gutterBottom>
            Connect to Server
          </Typography>
          <Box className="flex gap-4 flex-wrap items-end">
            <FormControl variant="outlined" className="min-w-[250px]">
              <InputLabel id="server-select-label">Select Server</InputLabel>
              <Select
                labelId="server-select-label"
                id="server-select"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                label="Select Server"
              >
                {servers.map((server) => (
                  <MenuItem key={server.id} value={server.id}>
                    {server.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConnect}
              disabled={!server && !customEndpoint}
            >
              Connect
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box className="mb-4 flex justify-between items-center">
          <Typography variant="subtitle1">
            {customEndpoint ? `Connected to custom endpoint: ${customEndpoint}` : 
              `Connected to: ${servers.find(s => s.id === server)?.name || 'Custom Server'}`}
          </Typography>
          <Box>
            <IconButton color="primary" className="mr-2">
              <RefreshIcon />
            </IconButton>
            <Button variant="outlined" color="secondary" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </Box>
        </Box>
      )}

      <Paper 
        elevation={3} 
        className="flex-1 p-1 relative overflow-hidden dark:bg-gray-900"
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        {isConnected ? (
          <Terminal socketUrl={getWebSocketUrl()} />
        ) : (
          <Box className="flex items-center justify-center h-full">
            <Typography variant="body1" color="textSecondary">
              Select a server and connect to start terminal session
            </Typography>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default TerminalPage;