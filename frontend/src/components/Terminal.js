import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const THEME = {
  background: '#111827',
  foreground: '#f9fafb',
  cursor: '#f9fafb',
  black: '#374151',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#8b5cf6',
  cyan: '#06b6d4',
  white: '#f3f4f6',
  brightBlack: '#6b7280',
  brightRed: '#f87171',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#a78bfa',
  brightCyan: '#22d3ee',
  brightWhite: '#ffffff',
};

const CLOSE_REASONS = {
  4401: 'token rejected',
  4404: 'container not found',
  4409: 'container is not running',
};

/** One shell session. Remount (change `key`) to reconnect. */
const Terminal = ({ socketUrl, token, onStatus }) => {
  const hostRef = useRef(null);
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    const term = new XTerm({
      theme: THEME,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(hostRef.current);

    const ws = new WebSocket(socketUrl);
    const send = (msg) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(msg));
    const resize = () => {
      try {
        fit.fit();
      } catch {
        return;
      }
      send({ type: 'resize', cols: term.cols, rows: term.rows });
    };

    statusRef.current?.('connecting');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      resize();
      term.focus();
      statusRef.current?.('connected');
    };
    ws.onmessage = (e) => term.write(e.data);
    ws.onclose = (e) => {
      const reason = CLOSE_REASONS[e.code] || e.reason || (e.code === 1000 ? 'shell exited' : `connection closed (${e.code})`);
      term.write(`\r\n\x1b[33m[session ended: ${reason}]\x1b[0m\r\n`);
      statusRef.current?.('closed');
    };

    const input = term.onData((data) => send({ type: 'input', data }));
    const observer = new ResizeObserver(() => resize());
    observer.observe(hostRef.current);

    return () => {
      observer.disconnect();
      input.dispose();
      ws.onclose = null;
      ws.close();
      term.dispose();
    };
  }, [socketUrl, token]);

  return <div ref={hostRef} className="h-full w-full p-2" />;
};

Terminal.propTypes = {
  socketUrl: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  onStatus: PropTypes.func,
};

export default Terminal;
