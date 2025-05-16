import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ThemeContext from "../contexts/ThemeContext";

const TaskTable = ({
  tasks = [],
  loading = false,
  onViewLogs,
  onStop,
  onStart,
  onRestart,
  onDelete,
}) => {
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [expandedRow, setExpandedRow] = useState(null);
  const { darkMode } = useContext(ThemeContext);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleExpandClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("running")) return "success";
    if (statusLower.includes("exited") || statusLower.includes("dead"))
      return "error";
    if (statusLower.includes("created")) return "info";
    if (statusLower.includes("paused")) return "warning";
    return "default";
  };

  // Format uptime from seconds to human-readable format
  const formatUptime = (uptime) => {
    if (uptime < 60) return `${uptime}s`;
    if (uptime < 3600) return `${Math.floor(uptime / 60)}m ${uptime % 60}s`;
    if (uptime < 86400)
      return `${Math.floor(uptime / 3600)}h ${Math.floor(
        (uptime % 3600) / 60
      )}m`;
    return `${Math.floor(uptime / 86400)}d ${Math.floor(
      (uptime % 86400) / 3600
    )}h`;
  };

  // Format memory usage
  const formatMemory = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Sort function
  const sortedTasks = tasks.sort((a, b) => {
    let valueA = a[orderBy];
    let valueB = b[orderBy];

    // Special case for status
    if (orderBy === "status") {
      valueA = a.status.toLowerCase();
      valueB = b.status.toLowerCase();
    }

    // Special case for memory
    if (orderBy === "memory") {
      valueA = parseInt(a.memory, 10);
      valueB = parseInt(b.memory, 10);
    }

    // Handle string comparison
    if (typeof valueA === "string" && typeof valueB === "string") {
      return order === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    // Handle numeric comparison
    return order === "asc" ? valueA - valueB : valueB - valueA;
  });

  return (
    <TableContainer component={Paper} className="dark:bg-gray-800">
      <Table sx={{ minWidth: 650 }} aria-label="task table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "name"}
                direction={orderBy === "name" ? order : "asc"}
                onClick={() => handleRequestSort("name")}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "image"}
                direction={orderBy === "image" ? order : "asc"}
                onClick={() => handleRequestSort("image")}
              >
                Image
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "status"}
                direction={orderBy === "status" ? order : "asc"}
                onClick={() => handleRequestSort("status")}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "uptime"}
                direction={orderBy === "uptime" ? order : "asc"}
                onClick={() => handleRequestSort("uptime")}
              >
                Uptime
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "cpu"}
                direction={orderBy === "cpu" ? order : "asc"}
                onClick={() => handleRequestSort("cpu")}
              >
                CPU %
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "memory"}
                direction={orderBy === "memory" ? order : "asc"}
                onClick={() => handleRequestSort("memory")}
              >
                Memory
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center" className="py-8">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" className="py-8">
                No containers found
              </TableCell>
            </TableRow>
          ) : (
            sortedTasks.map((task) => (
              <React.Fragment key={task.id}>
                <TableRow
                  hover
                  className={`${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <TableCell padding="checkbox">
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => handleExpandClick(task.id)}
                    >
                      {expandedRow === task.id ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {task.name}
                  </TableCell>
                  <TableCell>{task.image}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatUptime(task.uptime)}</TableCell>
                  <TableCell>{task.cpu.toFixed(2)}%</TableCell>
                  <TableCell>{formatMemory(task.memory)}</TableCell>
                  <TableCell align="right">
                    <Box className="flex justify-end gap-1">
                      <Tooltip title="View Logs">
                        <IconButton
                          size="small"
                          onClick={() => onViewLogs(task.id)}
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {task.status.toLowerCase().includes("running") ? (
                        <Tooltip title="Stop">
                          <IconButton
                            size="small"
                            onClick={() => onStop(task.id)}
                            color="error"
                          >
                            <StopIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Start">
                          <IconButton
                            size="small"
                            onClick={() => onStart(task.id)}
                            color="success"
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Restart">
                        <IconButton
                          size="small"
                          onClick={() => onRestart(task.id)}
                          color="warning"
                        >
                          <RestartAltIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(task.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Expanded row with details */}
                {expandedRow === task.id && (
                  <TableRow className={darkMode ? "bg-gray-900" : "bg-gray-50"}>
                    <TableCell colSpan={8} className="p-4">
                      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            Container Details
                          </h4>
                          <div className="text-xs space-y-1">
                            <p>
                              <span className="font-medium">ID:</span> {task.id}
                            </p>
                            <p>
                              <span className="font-medium">Created:</span>{" "}
                              {new Date(task.created).toLocaleString()}
                            </p>
                            <p>
                              <span className="font-medium">Ports:</span>{" "}
                              {task.ports || "None"}
                            </p>
                            <p>
                              <span className="font-medium">Network:</span>{" "}
                              {task.network || "default"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            Environment Variables
                          </h4>
                          <div className="text-xs space-y-1">
                            {task.env && task.env.length > 0 ? (
                              task.env.map((env, index) => (
                                <p key={index}>{env}</p>
                              ))
                            ) : (
                              <p>No environment variables</p>
                            )}
                          </div>
                        </div>
                      </Box>
                      <Box className="mt-4">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onViewLogs(task.id)}
                          startIcon={<VisibilityIcon />}
                        >
                          View Logs
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

TaskTable.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      uptime: PropTypes.number.isRequired,
      cpu: PropTypes.number.isRequired,
      memory: PropTypes.number.isRequired,
      created: PropTypes.string,
      ports: PropTypes.string,
      network: PropTypes.string,
      env: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  loading: PropTypes.bool,
  onViewLogs: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TaskTable;
