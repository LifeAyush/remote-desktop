import React from 'react';

/**
 * API utility for making REST API calls and WebSocket connections
 */

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000';

/**
 * Make a REST API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Response promise
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API endpoints
const api = {
  // System Monitoring
  getSystemMetrics: () => apiRequest('/api/metrics/system'),
  getProcessMetrics: () => apiRequest('/api/metrics/processes'),
  
  // Task Manager
  getTasks: () => apiRequest('/api/tasks'),
  getTaskLogs: (taskId) => apiRequest(`/api/tasks/${taskId}/logs`),
  
  // Task actions
  stopTask: (taskId) => apiRequest(`/api/tasks/${taskId}/stop`, { method: 'POST' }),
  restartTask: (taskId) => apiRequest(`/api/tasks/${taskId}/restart`, { method: 'POST' }),
  killTask: (taskId) => apiRequest(`/api/tasks/${taskId}/kill`, { method: 'POST' }),
  
  // ECR Tasks
  getEcrImages: () => apiRequest('/api/ecr/images'),
  createTask: (taskDefinition) => apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskDefinition),
  }),
};

/**
 * Create a WebSocket connection
 * @param {string} endpoint - WebSocket endpoint
 * @param {Object} handlers - Event handlers
 * @returns {WebSocket} - WebSocket connection
 */
export const createWebSocket = (endpoint, handlers = {}) => {
  const url = `${WS_BASE_URL}${endpoint}`;
  const ws = new WebSocket(url);
  
  // Setup default handlers
  ws.onopen = handlers.onOpen || (() => console.log('WebSocket connected'));
  ws.onclose = handlers.onClose || (() => console.log('WebSocket disconnected'));
  ws.onerror = handlers.onError || ((error) => console.error('WebSocket error:', error));
  ws.onmessage = handlers.onMessage || ((event) => console.log('WebSocket message:', event.data));
  
  return ws;
};

/**
 * Custom hook for polling an API endpoint
 * @param {Function} fetchFunction - Function that returns the data
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} isActive - Whether polling is active
 * @param {number} maxPolls - Maximum number of polls (optional)
 * @returns {Object} - Data and polling status
 */
export const usePolling = (fetchFunction, interval = 1000, isActive = true, maxPolls = null) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [pollCount, setPollCount] = React.useState(0);
  const [isPolling, setIsPolling] = React.useState(isActive);
  const timerRef = React.useRef(null);
  
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      setData(result);
      setError(null);
      setPollCount(prev => prev + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  const stopPolling = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = React.useCallback(() => {
    if (!isPolling) {
      setIsPolling(true);
      fetchData();
      timerRef.current = setInterval(() => {
        if (maxPolls && pollCount >= maxPolls - 1) {
          stopPolling();
        } else {
          fetchData();
        }
      }, interval);
    }
  }, [fetchData, interval, isPolling, maxPolls, pollCount, stopPolling]);
  
  React.useEffect(() => {
    if (isActive) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [isActive, startPolling, stopPolling]);
  
  return { data, loading, error, pollCount, startPolling, stopPolling };
};

// Sample response data for development/placeholder
export const sampleData = {
  systemMetrics: {
    cpu: {
      usage_percent: 45.8,
      cores: 8,
      history: Array(30).fill().map((_, i) => ({ time: Date.now() - (30 - i) * 1000, value: 40 + Math.random() * 20 }))
    },
    memory: {
      total: 16000000000, // 16GB in bytes
      used: 8500000000,   // 8.5GB in bytes
      history: Array(30).fill().map((_, i) => ({ time: Date.now() - (30 - i) * 1000, value: 8000000000 + Math.random() * 1000000000 }))
    }
  },
  processes: Array(10).fill().map((_, i) => ({
    pid: 1000 + i,
    name: ['node', 'python', 'chrome', 'docker', 'postgres'][i % 5],
    cpu_percent: Math.random() * 10,
    memory_bytes: Math.random() * 500000000,
    threads: Math.floor(Math.random() * 10) + 1
  })),
  tasks: Array(8).fill().map((_, i) => ({
    id: `container_${i}`,
    name: `task-${i}`,
    image: `image/task-${i}`,
    status: ['running', 'stopped', 'paused', 'running'][i % 4],
    cpu_usage: Math.random() * 25,
    memory_usage: Math.random() * 512 * 1000000,
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  })),
  taskLogs: "Starting container...\nInitializing runtime...\nConnecting to network...\nService ready.\nReceived HTTP request...\nProcessing data...\nOperation completed successfully.",
  ecrImages: Array(12).fill().map((_, i) => ({
    repositoryName: `repo-${Math.floor(i/3) + 1}`,
    imageName: `image-${i + 1}`,
    tag: ['latest', 'stable', 'dev', 'v1.0'][i % 4],
    size: Math.floor(Math.random() * 1000) + 100,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))
};

export default api;