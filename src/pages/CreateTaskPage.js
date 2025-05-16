import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TaskForm from '../components/TaskForm';
import api from '../utils/api';
import {toast} from 'react-toastify';

const CreateTaskPage = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ecrImages, setEcrImages] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const {getEcrImages, createTask} = api;

  // Step labels for the task creation process
  const steps = ['Select Image', 'Configure Task', 'Review & Create'];

  useEffect(() => {
    // Fetch available ECR images when component mounts
    const loadEcrImages = async () => {
      try {
        setLoading(true);
        const images = await getEcrImages();
        setEcrImages(images);
      } catch (error) {
        console.error('Failed to fetch ECR images:', error);
        toast.error('Failed to load ECR images');
      } finally {
        setLoading(false);
      }
    };

    loadEcrImages();
  }, [getEcrImages]);

  const handleSubmit = async (taskData) => {
    try {
      setSubmitting(true);
      // Send task creation request to API
      await createTask(taskData);
      toast.success('Task created successfully');
      // Redirect to tasks page after successful creation
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <div className="p-6 h-full">
      <Box className="mb-6 flex items-center">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/tasks')}
          className="mr-4"
        >
          Back to Tasks
        </Button>
        <Typography variant="h4" component="h1">
          Create New Task
        </Typography>
      </Box>

      <Paper elevation={2} className="p-6 mb-6 dark:bg-gray-800">
        <Stepper activeStep={activeStep} className="mb-8">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {loading ? (
          <Box className="flex justify-center items-center py-12">
            <CircularProgress />
            <Typography variant="body1" className="ml-3">
              Loading available images...
            </Typography>
          </Box>
        ) : (
          <TaskForm 
            ecrImages={ecrImages}
            onSubmit={handleSubmit}
            submitting={submitting}
            activeStep={activeStep}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
          />
        )}
      </Paper>
    </div>
  );
};

export default CreateTaskPage;