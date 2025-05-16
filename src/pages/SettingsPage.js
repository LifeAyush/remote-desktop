import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

const SettingsPage = () => {
  return (
    <div className="p-6">
      <Box className="mb-6">
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
      </Box>

      <Paper elevation={2} className="p-8 dark:bg-gray-800">
        <Box className="flex flex-col items-center justify-center text-center">
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Settings page is under construction. Check back later for updates.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
};

export default SettingsPage; 