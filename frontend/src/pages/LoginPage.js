import React, { useState } from 'react';
import { Alert, Button, Paper, TextField, Typography } from '@mui/material';
import { Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(token.trim());
    } catch (err) {
      setError(err.status === 401 ? 'That token was rejected.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center px-4">
      <Paper elevation={3} className="w-full max-w-sm p-8">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-blue-600 rounded-md flex items-center justify-center">
              <Server size={20} className="text-white" />
            </div>
            <Typography variant="h6">Remote Desktop</Typography>
          </div>
          <Typography variant="body2" color="text.secondary">
            Enter the API token. It is the <code>API_TOKEN</code> value the backend was started with.
          </Typography>
          <TextField
            label="API token"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={!token.trim() || busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </Button>
        </form>
      </Paper>
    </div>
  );
};

export default LoginPage;
