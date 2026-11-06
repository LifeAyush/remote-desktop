import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CPUChart from '../components/CPUChart';
import MemoryChart from '../components/MemoryChart';
import api, { usePolling } from '../utils/api';
import { formatBytes, formatUptime, percent } from '../utils/format';

const HISTORY = 60;
const INTERVAL_MS = 2000;

const Donut = ({ value, segments }) => {
  let start = 0;
  const stops = segments
    .map(({ value: v, color }) => {
      const end = start + (v / 100) * 360;
      const stop = `${color} ${start}deg ${end}deg`;
      start = end;
      return stop;
    })
    .concat(`rgba(148,163,184,.25) ${start}deg 360deg`)
    .join(', ');
  return (
    <div
      className="w-20 h-20 shrink-0 rounded-full flex items-center justify-center"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-semibold">
        {Math.round(value)}%
      </div>
    </div>
  );
};

const Legend = ({ items }) => (
  <div className="text-sm space-y-1">
    {items.map(({ label, color, text }) => (
      <div key={label} className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
        <span className="text-gray-500 dark:text-gray-400 w-14">{label}</span>
        <span>{text}</span>
      </div>
    ))}
  </div>
);

const columns = [
  { id: 'name', label: 'Process' },
  { id: 'pid', label: 'PID', numeric: true },
  { id: 'user', label: 'User' },
  { id: 'cpu', label: 'CPU %', numeric: true },
  { id: 'memory', label: 'Memory', numeric: true },
  { id: 'uptime', label: 'Uptime', numeric: true },
];

const MonitorPage = () => {
  const [live, setLive] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memHistory, setMemHistory] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ by: 'cpu', dir: 'desc' });

  usePolling(
    async () => {
      try {
        const [m, procs] = await Promise.all([api.systemMetrics(), api.processes()]);
        const time = Date.now();
        setMetrics(m);
        setProcesses(procs);
        setCpuHistory((h) => [...h, { time, total: m.cpu.total, user: m.cpu.user, system: m.cpu.system, idle: m.cpu.idle }].slice(-HISTORY));
        setMemHistory((h) => [...h, { time, total: m.memory.total, used: m.memory.used, free: m.memory.free }].slice(-HISTORY));
        setError('');
      } catch (err) {
        setError(err.message);
      }
    },
    INTERVAL_MS,
    live
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = processes.filter(
      (p) => (tab === 'all' || p.type === tab) && (!q || p.name.toLowerCase().includes(q) || String(p.pid).includes(q))
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = a[sort.by];
      const y = b[sort.by];
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir;
    });
  }, [processes, tab, query, sort]);

  const toggleSort = (by) =>
    setSort((s) => ({ by, dir: s.by === by && s.dir === 'desc' ? 'asc' : 'desc' }));

  const cpu = metrics?.cpu;
  const mem = metrics?.memory;
  const memPct = mem ? percent(mem.used, mem.total) : 0;

  return (
    <div className="p-6 space-y-6">
      <Box className="flex flex-wrap gap-3 justify-between items-center">
        <Typography variant="body2" color="text.secondary">
          {metrics
            ? `${cpu.cores} cores · load ${cpu.load.join(' / ')} · up ${formatUptime(metrics.uptime)} · every ${INTERVAL_MS / 1000}s`
            : 'Loading…'}
        </Typography>
        <Button
          variant={live ? 'outlined' : 'contained'}
          startIcon={live ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={() => setLive(!live)}
        >
          {live ? 'Pause' : 'Resume'}
        </Button>
      </Box>

      {error && <Alert severity="error">Metrics unavailable: {error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={1}>
            <CardHeader title="CPU" />
            <CardContent className="pt-0">
              <div className="flex items-center gap-6 mb-4">
                <Donut
                  value={cpu?.total || 0}
                  segments={[
                    { value: cpu?.user || 0, color: '#3b82f6' },
                    { value: cpu?.system || 0, color: '#f59e0b' },
                  ]}
                />
                <Legend
                  items={[
                    { label: 'User', color: '#3b82f6', text: `${(cpu?.user || 0).toFixed(1)}%` },
                    { label: 'System', color: '#f59e0b', text: `${(cpu?.system || 0).toFixed(1)}%` },
                    { label: 'Idle', color: 'rgba(148,163,184,.5)', text: `${(cpu?.idle || 0).toFixed(1)}%` },
                  ]}
                />
              </div>
              <CPUChart data={cpuHistory} isLive={live} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={1}>
            <CardHeader title="Memory" />
            <CardContent className="pt-0">
              <div className="flex items-center gap-6 mb-4">
                <Donut value={memPct} segments={[{ value: memPct, color: '#3b82f6' }]} />
                <Legend
                  items={[
                    { label: 'Used', color: '#3b82f6', text: formatBytes(mem?.used) },
                    { label: 'Free', color: '#10b981', text: formatBytes(mem?.free) },
                    { label: 'Total', color: 'rgba(148,163,184,.5)', text: formatBytes(mem?.total) },
                  ]}
                />
              </div>
              <MemoryChart data={memHistory} isLive={live} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1}>
        <Box className="flex flex-wrap gap-3 items-center justify-between px-4 pt-3">
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab value="all" label="All" />
            <Tab value="container" label="In containers" />
            <Tab value="system" label="Host" />
          </Tabs>
          <TextField size="small" placeholder="Filter by name or PID" value={query} onChange={(e) => setQuery(e.target.value)} />
        </Box>
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.id} align={c.numeric ? 'right' : 'left'}>
                    <TableSortLabel
                      active={sort.by === c.id}
                      direction={sort.by === c.id ? sort.dir : 'desc'}
                      onClick={() => toggleSort(c.id)}
                    >
                      {c.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.pid} hover>
                  <TableCell>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${p.type === 'container' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    {p.name}
                  </TableCell>
                  <TableCell align="right">{p.pid}</TableCell>
                  <TableCell>{p.user}</TableCell>
                  <TableCell align="right">{p.cpu.toFixed(1)}</TableCell>
                  <TableCell align="right">{formatBytes(p.memory)}</TableCell>
                  <TableCell align="right">{formatUptime(p.uptime)}</TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" className="py-8">
                    {metrics ? 'No matching processes' : 'Loading…'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default MonitorPage;
