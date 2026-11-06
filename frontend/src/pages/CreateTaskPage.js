import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, CircularProgress, Paper, Step, StepLabel, Stepper } from '@mui/material';
import { toast } from 'react-toastify';
import TaskForm from '../components/TaskForm';
import api from '../utils/api';

const STEPS = ['Image', 'Configure', 'Review'];

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadImages = useCallback(async () => {
    try {
      setImages(await api.images());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const pull = async (ref) => {
    const img = await api.pullImage(ref);
    await loadImages();
    toast.success(`Pulled ${img.tags[0] || ref}`);
    return img;
  };

  const submit = async (spec) => {
    setSubmitting(true);
    try {
      const task = await api.createTask(spec);
      toast.success(`${task.name} is ${task.status}`);
      navigate('/tasks');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Paper elevation={1} className="p-6 max-w-4xl">
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>Could not load images: {error}</Alert>}
        {loading ? (
          <Box className="flex justify-center py-12">
            <CircularProgress />
          </Box>
        ) : (
          <TaskForm
            images={images}
            onPull={pull}
            onSubmit={submit}
            submitting={submitting}
            step={step}
            onNext={() => setStep((s) => s + 1)}
            onBack={() => setStep((s) => s - 1)}
          />
        )}
      </Paper>
    </div>
  );
};

export default CreateTaskPage;
