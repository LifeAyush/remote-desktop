import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Slider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import bytesToSize from '../utils/bytesToSize';

const TaskForm = ({ ecrImages, onSubmit, submitting, activeStep, onNextStep, onPrevStep }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    cpuAllocation: 1,
    memoryAllocation: 1024,
    envVars: [],
    ports: [],
    volumes: []
  });

  // Temp state for adding new environment variables
  const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '' });
  
  // Temp state for adding new port mapping
  const [newPort, setNewPort] = useState({ containerPort: '', hostPort: '' });
  
  // Temp state for adding new volume mounts
  const [newVolume, setNewVolume] = useState({ containerPath: '', hostPath: '' });

  // Select image step content
  const renderImageSelection = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Select Container Image
        </Typography>
        
        <FormControl fullWidth variant="outlined" className="mb-6">
          <InputLabel id="image-select-label">Container Image</InputLabel>
          <Select
            labelId="image-select-label"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            label="Container Image"
            required
          >
            <MenuItem value="">
              <em>Select an image</em>
            </MenuItem>
            {ecrImages.map((image) => (
              <MenuItem key={image.uri} value={image.uri}>
                <Box className="flex items-center justify-between w-full">
                  <span>{image.name}</span>
                  <Chip 
                    size="small" 
                    label={image.tag || 'latest'} 
                    color="primary" 
                    variant="outlined"
                    className="ml-2"
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {formData.image && (
          <TableContainer component={Paper} className="mb-4 dark:bg-gray-700">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Image Details</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ecrImages.filter(img => img.uri === formData.image).map((selectedImage) => (
                  <React.Fragment key={selectedImage.uri}>
                    <TableRow>
                      <TableCell>Repository</TableCell>
                      <TableCell>{selectedImage.repository}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tag</TableCell>
                      <TableCell>{selectedImage.tag || 'latest'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Size</TableCell>
                      <TableCell>{bytesToSize(selectedImage.sizeInBytes)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Created</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(selectedImage.createdAt), { addSuffix: true })}</TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  // Configure task step content
  const renderTaskConfiguration = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configure Task
        </Typography>
        
        <TextField
          fullWidth
          label="Task Name"
          variant="outlined"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          margin="normal"
          required
          className="mb-4"
        />

        <Grid container spacing={4} className="mb-6">
          <Grid item xs={6}>
            <Typography gutterBottom>
              CPU Allocation (cores)
            </Typography>
            <Slider
              value={formData.cpuAllocation}
              onChange={(e, newValue) => setFormData({ ...formData, cpuAllocation: newValue })}
              min={0.25}
              max={4}
              step={0.25}
              marks={[
                { value: 0.25, label: '0.25' },
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 4, label: '4' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={6}>
            <Typography gutterBottom>
              Memory Allocation (MB)
            </Typography>
            <Slider
              value={formData.memoryAllocation}
              onChange={(e, newValue) => setFormData({ ...formData, memoryAllocation: newValue })}
              min={256}
              max={8192}
              step={256}
              marks={[
                { value: 256, label: '256MB' },
                { value: 1024, label: '1GB' },
                { value: 4096, label: '4GB' },
                { value: 8192, label: '8GB' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        <Divider className="my-6" />
        
        {/* Environment Variables Section */}
        <Box className="mb-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6">
              Environment Variables
              <Tooltip title="Define environment variables that will be passed to the container">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
          </Box>
          
          <Grid container spacing={2} className="mb-2">
            <Grid item xs={5}>
              <TextField
                fullWidth
                label="Key"
                variant="outlined"
                size="small"
                value={newEnvVar.key}
                onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                label="Value"
                variant="outlined"
                size="small"
                value={newEnvVar.value}
                onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  if (newEnvVar.key.trim()) {
                    setFormData({
                      ...formData,
                      envVars: [...formData.envVars, { ...newEnvVar }]
                    });
                    setNewEnvVar({ key: '', value: '' });
                  }
                }}
                disabled={!newEnvVar.key.trim()}
                fullWidth
              >
                Add
              </Button>
            </Grid>
          </Grid>
          
          {formData.envVars.length > 0 ? (
            <TableContainer component={Paper} className="mt-2 dark:bg-gray-700">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.envVars.map((env, index) => (
                    <TableRow key={index}>
                      <TableCell>{env.key}</TableCell>
                      <TableCell>{env.value}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newEnvVars = [...formData.envVars];
                            newEnvVars.splice(index, 1);
                            setFormData({ ...formData, envVars: newEnvVars });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="textSecondary" className="mt-2 italic">
              No environment variables defined
            </Typography>
          )}
        </Box>
        
        <Divider className="my-6" />
        
        {/* Port Mappings Section */}
        <Box className="mb-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6">
              Port Mappings
              <Tooltip title="Map container ports to host ports">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
          </Box>
          
          <Grid container spacing={2} className="mb-2">
            <Grid item xs={5}>
              <TextField
                fullWidth
                label="Container Port"
                variant="outlined"
                size="small"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 65535 } }}
                value={newPort.containerPort}
                onChange={(e) => setNewPort({ ...newPort, containerPort: e.target.value })}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                label="Host Port"
                variant="outlined"
                size="small"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 65535 } }}
                value={newPort.hostPort}
                onChange={(e) => setNewPort({ ...newPort, hostPort: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  if (newPort.containerPort && newPort.hostPort) {
                    setFormData({
                      ...formData,
                      ports: [...formData.ports, { ...newPort }]
                    });
                    setNewPort({ containerPort: '', hostPort: '' });
                  }
                }}
                disabled={!newPort.containerPort || !newPort.hostPort}
                fullWidth
              >
                Add
              </Button>
            </Grid>
          </Grid>
          
          {formData.ports.length > 0 ? (
            <TableContainer component={Paper} className="mt-2 dark:bg-gray-700">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Container Port</TableCell>
                    <TableCell>Host Port</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.ports.map((port, index) => (
                    <TableRow key={index}>
                      <TableCell>{port.containerPort}</TableCell>
                      <TableCell>{port.hostPort}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newPorts = [...formData.ports];
                            newPorts.splice(index, 1);
                            setFormData({ ...formData, ports: newPorts });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="textSecondary" className="mt-2 italic">
              No port mappings defined
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Review and submit step content
  const renderReviewStep = () => {
    const selectedImage = ecrImages.find(img => img.uri === formData.image) || {};
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Review Task Configuration
        </Typography>
        
        <TableContainer component={Paper} className="mb-6 dark:bg-gray-700">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell variant="head" width="30%">Task Name</TableCell>
                <TableCell>{formData.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">Image</TableCell>
                <TableCell>
                  {selectedImage.name}
                  {selectedImage.tag && (
                    <Chip 
                      size="small" 
                      label={selectedImage.tag} 
                      color="primary" 
                      variant="outlined"
                      className="ml-2"
                    />
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">CPU Allocation</TableCell>
                <TableCell>{formData.cpuAllocation} cores</TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">Memory Allocation</TableCell>
                <TableCell>{formData.memoryAllocation} MB</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Typography variant="subtitle1" gutterBottom>
          Environment Variables
        </Typography>
        {formData.envVars.length > 0 ? (
          <TableContainer component={Paper} className="mb-6 dark:bg-gray-700">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.envVars.map((env, index) => (
                  <TableRow key={index}>
                    <TableCell>{env.key}</TableCell>
                    <TableCell>{env.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="textSecondary" className="mb-4 italic">
            No environment variables defined
          </Typography>
        )}
        
        <Typography variant="subtitle1" gutterBottom>
          Port Mappings
        </Typography>
        {formData.ports.length > 0 ? (
          <TableContainer component={Paper} className="mb-6 dark:bg-gray-700">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Container Port</TableCell>
                  <TableCell>Host Port</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.ports.map((port, index) => (
                  <TableRow key={index}>
                    <TableCell>{port.containerPort}</TableCell>
                    <TableCell>{port.hostPort}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="textSecondary" className="mb-4 italic">
            No port mappings defined
          </Typography>
        )}
      </Box>
    );
  };

  // Render different form content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderImageSelection();
      case 1:
        return renderTaskConfiguration();
      case 2:
        return renderReviewStep();
      default:
        return 'Unknown step';
    }
  };
  
  // Check if current step is valid and can proceed
  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return !!formData.image;
      case 1:
        return !!formData.name;
      default:
        return true;
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (activeStep === 2) {
        onSubmit(formData);
      }
    }}>
      {getStepContent(activeStep)}
      
      <Box className="mt-8 flex justify-between">
        <Button
          variant="outlined"
          onClick={onPrevStep}
          disabled={activeStep === 0 || submitting}
        >
          Back
        </Button>
        
        <Box>
          {activeStep === 2 ? (
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitting || !isStepValid(activeStep)}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={onNextStep}
              disabled={!isStepValid(activeStep)}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </form>
  );
};

TaskForm.propTypes = {
  ecrImages: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  activeStep: PropTypes.number.isRequired,
  onNextStep: PropTypes.func.isRequired,
  onPrevStep: PropTypes.func.isRequired
};

export default TaskForm;