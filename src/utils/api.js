import React from 'react';

/**
 * API utility for making REST API calls and WebSocket connections
 */

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'http://localhost:8000/ws';

/**
 * Make a REST API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET or POST)
 * @param {Object} body - Request body for POST requests
 * @returns {Promise} - Response promise
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && body) {
      config.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    // Return sample data based on the endpoint
    if (endpoint === '/api/metrics/system') {
      return sampleData.systemMetrics;
    } else if (endpoint === '/api/metrics/processes') {
      return sampleData.processes;
    } else if (endpoint === '/api/tasks') {
      return sampleData.tasks;
    } else if (endpoint.startsWith('/api/tasks/') && endpoint.endsWith('/logs')) {
      return sampleData.taskLogs;
    } else if (endpoint === '/api/ecr/images') {
      return sampleData.ecrImages;
    }
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
  stopTask: (taskId) => apiRequest(`/api/tasks/${taskId}/stop`, 'POST'),
  restartTask: (taskId) => apiRequest(`/api/tasks/${taskId}/restart`, 'POST'),
  killTask: (taskId) => apiRequest(`/api/tasks/${taskId}/kill`, 'POST'),
  
  // ECR Tasks
  getEcrImages: () => apiRequest('/ecr/images/dev-test'),
  createTask: (taskDefinition) => apiRequest('/api/tasks', 'POST', taskDefinition),
};

/**
 * Create a WebSocket connection
 * @param {string} endpoint - WebSocket endpoint
 * @param {Object} handlers - Event handlers
 * @returns {WebSocket} - WebSocket connection
 */
export const createWebSocket = (endpoint, handlers = {}) => {
  const ws = new WebSocket(WS_BASE_URL);
  
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
      total: 100,
      user: 30,
      system: 15,
      idle: 55,
      history: Array(30).fill().map((_, i) => ({ 
        time: Date.now() - (30 - i) * 1000, 
        total: 100,
        user: 30 + Math.random() * 10,
        system: 15 + Math.random() * 5,
        idle: 55 - Math.random() * 15
      }))
    },
    memory: {
      total: 16000000000, // 16GB in bytes
      used: 8500000000,   // 8.5GB in bytes
      free: 7500000000,   // 7.5GB in bytes
      history: Array(30).fill().map((_, i) => ({ 
        time: Date.now() - (30 - i) * 1000, 
        total: 16000000000,
        used: 8000000000 + Math.random() * 1000000000,
        free: 8000000000 - Math.random() * 1000000000
      }))
    }
  },
  processes: [
    // Container processes
    {
      pid: 1001,
      name: 'nginx',
      cpu: 2.5,
      memory: '256MB',
      uptime: 3600,
      type: 'container'
    },
    {
      pid: 1002,
      name: 'redis',
      cpu: 1.8,
      memory: '512MB',
      uptime: 7200,
      type: 'container'
    },
    {
      pid: 1003,
      name: 'postgres',
      cpu: 3.2,
      memory: '1.2GB',
      uptime: 10800,
      type: 'container'
    },
    {
      pid: 1004,
      name: 'node-app',
      cpu: 4.1,
      memory: '768MB',
      uptime: 5400,
      type: 'container'
    },
    // System processes
    {
      pid: 1,
      name: 'systemd',
      cpu: 0.2,
      memory: '128MB',
      uptime: 86400,
      type: 'system'
    },
    {
      pid: 2,
      name: 'kthreadd',
      cpu: 0.1,
      memory: '64MB',
      uptime: 86400,
      type: 'system'
    },
    {
      pid: 3,
      name: 'ksoftirqd',
      cpu: 0.3,
      memory: '96MB',
      uptime: 86400,
      type: 'system'
    },
    {
      pid: 4,
      name: 'kworker',
      cpu: 0.4,
      memory: '112MB',
      uptime: 86400,
      type: 'system'
    },
    // Additional processes
    {
      pid: 1005,
      name: 'chrome',
      cpu: 5.2,
      memory: '2.1GB',
      uptime: 1800,
      type: 'container'
    },
    {
      pid: 1006,
      name: 'firefox',
      cpu: 4.8,
      memory: '1.8GB',
      uptime: 2400,
      type: 'container'
    },
    {
      pid: 5,
      name: 'cron',
      cpu: 0.1,
      memory: '48MB',
      uptime: 86400,
      type: 'system'
    },
    {
      pid: 6,
      name: 'sshd',
      cpu: 0.2,
      memory: '72MB',
      uptime: 86400,
      type: 'system'
    }
  ],
  tasks: Array(8).fill().map((_, i) => ({
    id: `container_${i}`,
    name: `task-${i}`,
    image: `image/task-${i}`,
    status: ['running', 'stopped', 'paused', 'running'][i % 4],
    cpu: Math.random() * 25,
    memory: Math.random() * 512 * 1000000,
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  })),
  taskLogs: "Starting container...\nInitializing runtime...\nConnecting to network...\nService ready.\nReceived HTTP request...\nProcessing data...\nOperation completed successfully.",
  ecrImages: [
    {
      imageDigest: "sha256:8bd5e5d8378fbf87291aeaffb9a5e96bc52ef3460d15030ce0e522010898a3a9",
      imageTags: ["1"],
      imageSizeMB: 363.13,
      pushedAt: "2025-05-16T15:46:55.663000+05:30"
    }
  ]
};

export default api;