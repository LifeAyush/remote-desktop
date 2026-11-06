import { useEffect, useRef } from 'react';

// Empty means same origin: nginx (in Docker) or the dev-server proxy forwards
// /api and /ws to the backend.
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'rdc.token';

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked: the session lasts until reload
  }
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const describe = (detail, fallback) => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${(d.loc || []).slice(-1)[0] || 'request'}: ${d.msg}`).join('; ');
  }
  return fallback;
};

async function request(path, { method = 'GET', body, token = getToken() } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the backend');
  }

  if (res.status === 401) {
    onUnauthorized();
    throw new ApiError(401, 'Token rejected');
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = describe((await res.json()).detail, detail);
    } catch {
      // not JSON
    }
    throw new ApiError(res.status, detail);
  }
  return res.status === 204 ? null : res.json();
}

const api = {
  session: (token) => request('/api/session', { token }),
  systemMetrics: () => request('/api/metrics/system'),
  processes: () => request('/api/metrics/processes'),
  tasks: () => request('/api/tasks'),
  createTask: (spec) => request('/api/tasks', { method: 'POST', body: spec }),
  taskAction: (id, action) => request(`/api/tasks/${id}/${action}`, { method: 'POST' }),
  removeTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  taskLogs: (id, tail = 500) => request(`/api/tasks/${id}/logs?tail=${tail}`).then((r) => r.logs),
  images: () => request('/api/images'),
  pullImage: (ref) => request('/api/images/pull', { method: 'POST', body: { ref } }),
};

export function wsUrl(path) {
  const base = API_BASE || window.location.origin;
  return base.replace(/^http/, 'ws') + path;
}

/**
 * Call fn now and then every intervalMs while active. The next call is
 * scheduled only after the previous one settles, so slow responses never pile up.
 */
export function usePolling(fn, intervalMs, active = true) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  });
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let timer;
    const tick = async () => {
      try {
        await saved.current();
      } finally {
        if (!cancelled) timer = setTimeout(tick, intervalMs);
      }
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intervalMs, active]);
}

export default api;
