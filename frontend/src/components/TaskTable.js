import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import TerminalIcon from '@mui/icons-material/Terminal';
import BoltIcon from '@mui/icons-material/Bolt';
import LockIcon from '@mui/icons-material/Lock';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { formatBytes, formatUptime, percent } from '../utils/format';

const statusColor = (status) =>
  ({ running: 'success', exited: 'default', dead: 'error', created: 'info', paused: 'warning', restarting: 'warning' })[status] ||
  'default';

const columns = [
  { id: 'name', label: 'Name' },
  { id: 'image', label: 'Image' },
  { id: 'status', label: 'Status' },
  { id: 'uptime', label: 'Uptime', numeric: true },
  { id: 'cpu', label: 'CPU %', numeric: true },
  { id: 'memory', label: 'Memory', numeric: true },
];

const Action = ({ title, onClick, color, disabled, children }) => (
  <Tooltip title={title}>
    <span>
      <IconButton size="small" onClick={onClick} color={color} disabled={disabled} aria-label={title}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const TaskTable = ({ tasks, loading, busyId, onAction, onViewLogs, onOpenTerminal }) => {
  const [sort, setSort] = useState({ by: 'name', dir: 'asc' });
  const [expanded, setExpanded] = useState(null);

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...tasks].sort((a, b) => {
      const x = a[sort.by];
      const y = b[sort.by];
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir;
    });
  }, [tasks, sort]);

  const toggleSort = (by) => setSort((s) => ({ by, dir: s.by === by && s.dir === 'asc' ? 'desc' : 'asc' }));

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            {columns.map((c) => (
              <TableCell key={c.id} align={c.numeric ? 'right' : 'left'}>
                <TableSortLabel active={sort.by === c.id} direction={sort.by === c.id ? sort.dir : 'asc'} onClick={() => toggleSort(c.id)}>
                  {c.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && !tasks.length ? (
            <TableRow>
              <TableCell colSpan={8} align="center" className="py-8">
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          ) : !tasks.length ? (
            <TableRow>
              <TableCell colSpan={8} align="center" className="py-8">
                No containers match
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((t) => {
              const running = t.status === 'running';
              const busy = busyId === t.id;
              const open = expanded === t.id;
              return (
                <React.Fragment key={t.id}>
                  <TableRow hover sx={{ '& > td': { borderBottom: open ? 'none' : undefined } }}>
                    <TableCell padding="checkbox">
                      <IconButton size="small" aria-label="details" onClick={() => setExpanded(open ? null : t.id)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        {t.name}
                        {t.protected && (
                          <Tooltip title="Part of this stack. Stop and remove are disabled.">
                            <LockIcon sx={{ fontSize: 14 }} color="disabled" />
                          </Tooltip>
                        )}
                        {t.managed && <Chip label="created here" size="small" variant="outlined" sx={{ ml: 1, height: 20 }} />}
                      </Box>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.image}</TableCell>
                    <TableCell>
                      <Chip label={t.status} color={statusColor(t.status)} size="small" />
                    </TableCell>
                    <TableCell align="right">{running ? formatUptime(t.uptime) : '—'}</TableCell>
                    <TableCell align="right">{running ? t.cpu.toFixed(1) : '—'}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 130 }}>
                      {running ? (
                        <Tooltip title={t.memory_limit ? `limit ${formatBytes(t.memory_limit)}` : ''}>
                          <div>
                            {formatBytes(t.memory)}
                            {t.memory_limit > 0 && (
                              <LinearProgress variant="determinate" value={Math.min(percent(t.memory, t.memory_limit), 100)} sx={{ mt: 0.5, height: 3, borderRadius: 2 }} />
                            )}
                          </div>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {busy ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <>
                          <Action title="Logs" onClick={() => onViewLogs(t)} color="primary">
                            <ArticleIcon fontSize="small" />
                          </Action>
                          <Action title="Terminal" onClick={() => onOpenTerminal(t)} disabled={!running}>
                            <TerminalIcon fontSize="small" />
                          </Action>
                          {running ? (
                            <Action title="Stop" onClick={() => onAction(t, 'stop')} color="error" disabled={t.protected}>
                              <StopIcon fontSize="small" />
                            </Action>
                          ) : (
                            <Action title="Start" onClick={() => onAction(t, 'start')} color="success">
                              <PlayArrowIcon fontSize="small" />
                            </Action>
                          )}
                          <Action title="Restart" onClick={() => onAction(t, 'restart')} color="warning" disabled={t.protected}>
                            <RestartAltIcon fontSize="small" />
                          </Action>
                          <Action title="Kill" onClick={() => onAction(t, 'kill')} color="error" disabled={!running || t.protected}>
                            <BoltIcon fontSize="small" />
                          </Action>
                          <Action title="Remove" onClick={() => onAction(t, 'remove')} color="error" disabled={t.protected}>
                            <DeleteIcon fontSize="small" />
                          </Action>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs py-2">
                          <p><span className="font-medium">ID</span> <span className="font-mono">{t.id}</span></p>
                          <p><span className="font-medium">Created</span> {new Date(t.created).toLocaleString()}</p>
                          <p><span className="font-medium">Ports</span> {t.ports || 'none'}</p>
                          <p><span className="font-medium">Network</span> {t.network || '—'}</p>
                          <p className="md:col-span-2">
                            <span className="font-medium">Environment</span>{' '}
                            {t.env.length ? t.env.join(', ') : 'none'}{' '}
                            <span className="text-gray-500">(names only; values are never sent to the browser)</span>
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const taskShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  uptime: PropTypes.number.isRequired,
  cpu: PropTypes.number.isRequired,
  memory: PropTypes.number.isRequired,
  memory_limit: PropTypes.number,
  created: PropTypes.string,
  ports: PropTypes.string,
  network: PropTypes.string,
  env: PropTypes.arrayOf(PropTypes.string),
  managed: PropTypes.bool,
  protected: PropTypes.bool,
});

TaskTable.propTypes = {
  tasks: PropTypes.arrayOf(taskShape).isRequired,
  loading: PropTypes.bool,
  busyId: PropTypes.string,
  onAction: PropTypes.func.isRequired,
  onViewLogs: PropTypes.func.isRequired,
  onOpenTerminal: PropTypes.func.isRequired,
};

export default TaskTable;
