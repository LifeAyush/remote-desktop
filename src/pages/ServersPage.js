import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';

const ServersPage = () => {
  return (
    <div className="p-6">
      <Box className="mb-6">
        <Typography variant="h4" component="h1">
          Server Management
        </Typography>
      </Box>

      <Paper elevation={2} className="p-8 dark:bg-gray-800">
        <Box className="flex flex-col items-center justify-center text-center">
          <StorageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Server management features are under development. Check back soon for server configuration and monitoring capabilities.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
};

export default ServersPage; 