import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CPUChart from "../components/CPUChart";
import MemoryChart from "../components/MemoryChart";
import api from "../utils/api";
import { usePolling } from "../utils/api";
import { toast } from "react-toastify";

const MonitorPage = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: {
      total: 0,
      user: 0,
      system: 0,
      idle: 0,
      history: [],
    },
    memory: {
      total: 0,
      used: 0,
      free: 0,
      history: [],
    },
  });

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [orderBy, setOrderBy] = useState("cpu");
  const [order, setOrder] = useState("desc");
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { getProcessMetrics, getSystemMetrics } = api;

  // Load system metrics
  const loadSystemMetrics = async () => {
    try {
      const data = await getSystemMetrics();

      // Update system metrics with history
      setSystemMetrics((prevMetrics) => {
        // Keep last 30 data points for the charts
        const cpuHistory = [
          ...prevMetrics.cpu.history,
          {
            time: new Date(),
            total: data.cpu.total,
            user: data.cpu.user,
            system: data.cpu.system,
            idle: data.cpu.idle,
          },
        ].slice(-30);

        const memoryHistory = [
          ...prevMetrics.memory.history,
          {
            time: new Date(),
            total: data.memory.total,
            used: data.memory.used,
            free: data.memory.free,
          },
        ].slice(-30);

        return {
          cpu: {
            ...data.cpu,
            history: cpuHistory,
          },
          memory: {
            ...data.memory,
            history: memoryHistory,
          },
        };
      });

      // Load process metrics
      const processData = await getProcessMetrics();
      setProcesses(processData);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      toast.error("Failed to fetch system metrics");
    } finally {
      setLoading(false);
    }
  };

  // Setup polling to refresh metrics data
  const { startPolling, stopPolling } = usePolling(loadSystemMetrics, 1000, false, 30);

  useEffect(() => {
    loadSystemMetrics();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    startPolling();
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    stopPolling();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Create sort handler
  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  // Sort processes based on current orderBy and order
  const sortedProcesses = React.useMemo(() => {
    return [...processes].sort((a, b) => {
      const valueA = a[orderBy];
      const valueB = b[orderBy];

      if (valueA < valueB) {
        return order === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [processes, order, orderBy]);

  // Format uptime from seconds to readable format
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length ? parts.join(" ") : "Less than 1m";
  };

  return (
    <div className="p-6 pb-6">
      <Box className="mb-6 flex justify-between items-center">
        <Typography variant="h4" component="h1">
          System Monitoring
        </Typography>

        <Box className="flex items-center gap-2">
          {!isMonitoring ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartMonitoring}
            >
              Start Monitoring
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStopMonitoring}
            >
              Stop Monitoring
            </Button>
          )}
          <Tooltip title="Refresh metrics">
            <IconButton onClick={loadSystemMetrics} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && !systemMetrics.cpu.history.length ? (
        <Box className="flex justify-center items-center py-12">
          <CircularProgress />
          <Typography variant="body1" className="ml-3">
            Loading system metrics...
          </Typography>
        </Box>
      ) : (
        <>
          {/* System Overview Cards */}
          <Grid container spacing={3} className="mb-6 w-full">
            <Grid item xs={12} md={8} sx={{ minWidth: 0, boxSizing: 'border-box', width: '420px' }}>
              <Card elevation={2} className="dark:bg-gray-800">
                <CardHeader
                  title="CPU Usage"
                  action={
                    <Tooltip title="CPU utilization across all cores">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                />
                <CardContent className="p-2">
                  <Box className="flex items-center mb-4">
                    <Box
                      className="w-16 h-16 relative rounded-full flex items-center justify-center"
                      sx={{
                        background: `radial-gradient(#484848 55%, transparent 56%),
                          conic-gradient(
                            #1976d2 0deg ${(systemMetrics.cpu.user / 100) * 360}deg,
                            #4caf50 ${(systemMetrics.cpu.user / 100) * 360}deg ${((systemMetrics.cpu.user + systemMetrics.cpu.system) / 100) * 360}deg,
                            #e0e0e0 ${((systemMetrics.cpu.user + systemMetrics.cpu.system) / 100) * 360}deg 360deg
                          )`,
                      }}
                    >
                      <Typography variant="h7 text-white">
                        {Math.round(systemMetrics.cpu.total)}%
                      </Typography>
                    </Box>
                    <Box className="ml-4">
                      <Box className="flex items-center mb-1">
                        <Box className="w-4 h-4 rounded-sm bg-blue-500 mr-2" />
                        <Typography variant="body2">
                          User: {Math.round(systemMetrics.cpu.user)}%
                        </Typography>
                      </Box>
                      <Box className="flex items-center mb-1">
                        <Box className="w-4 h-4 rounded-sm bg-green-500 mr-2" />
                        <Typography variant="body2">
                          System: {Math.round(systemMetrics.cpu.system)}%
                        </Typography>
                      </Box>
                      <Box className="flex items-center">
                        <Box className="w-4 h-4 rounded-sm bg-gray-300 mr-2" />
                        <Typography variant="body2">
                          Idle: {Math.round(systemMetrics.cpu.idle)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Divider className="mb-2" />
                  <CPUChart data={systemMetrics.cpu.history} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4} sx={{ minWidth: 0, boxSizing: 'border-box', width: '420px' }}>
              <Card elevation={2} className="dark:bg-gray-800">
                <CardHeader
                  title="Memory Usage"
                  action={
                    <Tooltip title="Physical memory usage">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                />
                <CardContent className="p-2">
                  <Box className="flex items-center mb-4">
                    <Box
                      className="w-16 h-16 relative rounded-full flex items-center justify-center"
                      sx={{
                        background: `radial-gradient(#484848 55%, transparent 56%),
                          conic-gradient(#1976d2 ${
                            (systemMetrics.memory.used /
                              systemMetrics.memory.total) *
                            360
                          }deg, #e0e0e0 0deg)`,
                      }}
                    >
                      <Typography variant="h7 text-white">
                        {Math.round(
                          (systemMetrics.memory.used /
                            systemMetrics.memory.total) *
                            100
                        )}
                        %
                      </Typography>
                    </Box>
                    <Box className="ml-4">
                      <Box className="flex items-center mb-1">
                        <Box className="w-4 h-4 rounded-sm bg-blue-500 mr-2" />
                        <Typography variant="body2">
                          Used: {systemMetrics.memory.used}
                        </Typography>
                      </Box>
                      <Box className="flex items-center mb-1">
                        <Box className="w-4 h-4 rounded-sm bg-green-500 mr-2" />
                        <Typography variant="body2">
                          Free: {systemMetrics.memory.free}
                        </Typography>
                      </Box>
                      <Box className="flex items-center">
                        <Box className="w-4 h-4 rounded-sm bg-gray-700 mr-2" />
                        <Typography variant="body2">
                          Total: {systemMetrics.memory.total}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Divider className="mb-2" />
                  <MemoryChart data={systemMetrics.memory.history} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Process Tabs */}
          <Paper elevation={2} className="dark:bg-gray-800">
            <Box className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Typography variant="h6">Process Monitoring</Typography>
            </Box>

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              className="px-4 border-b border-gray-200 dark:border-gray-700"
            >
              <Tab label="All Processes" />
              <Tab label="Running Containers" />
              <Tab label="System Processes" />
            </Tabs>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "name"}
                        direction={orderBy === "name" ? order : "asc"}
                        onClick={createSortHandler("name")}
                      >
                        Process Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "pid"}
                        direction={orderBy === "pid" ? order : "asc"}
                        onClick={createSortHandler("pid")}
                      >
                        PID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "cpu"}
                        direction={orderBy === "cpu" ? order : "asc"}
                        onClick={createSortHandler("cpu")}
                      >
                        CPU %
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "memory"}
                        direction={orderBy === "memory" ? order : "asc"}
                        onClick={createSortHandler("memory")}
                      >
                        Memory
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "uptime"}
                        direction={orderBy === "uptime" ? order : "asc"}
                        onClick={createSortHandler("uptime")}
                      >
                        Uptime
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedProcesses
                    .filter((process) => {
                      if (tabValue === 0) return true;
                      if (tabValue === 1) return process.type === "container";
                      if (tabValue === 2) return process.type === "system";
                      return true;
                    })
                    .map((process) => (
                      <TableRow key={process.pid}>
                        <TableCell>{process.name}</TableCell>
                        <TableCell>{process.pid}</TableCell>
                        <TableCell>{process.cpu.toFixed(1)}%</TableCell>
                        <TableCell>{process.memory}</TableCell>
                        <TableCell>{formatUptime(process.uptime)}</TableCell>
                        <TableCell>
                          <Box className="flex items-center">
                            {process.type === "container" ? (
                              <Box className="bg-blue-500 w-3 h-3 rounded-full mr-2" />
                            ) : (
                              <Box className="bg-gray-500 w-3 h-3 rounded-full mr-2" />
                            )}
                            {process.type}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </div>
  );
};

export default MonitorPage;
