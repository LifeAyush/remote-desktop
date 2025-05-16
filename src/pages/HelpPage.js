import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const HelpPage = () => {
  return (
    <div className="p-6">
      <Box className="mb-6">
        <Typography variant="h4" component="h1">
          Help & Documentation
        </Typography>
      </Box>

      <Paper elevation={2} className="p-8 dark:bg-gray-800">
        <Box className="flex flex-col items-center justify-center text-center">
          <HelpOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Help documentation is being prepared. Check back soon for detailed guides and support.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
};

export default HelpPage; 