import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

// Utility function to format memory values
const formatMemory = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

// Utility to convert bytes to GB for chart display
const bytesToGB = (bytes) => {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
};

const MemoryChart = ({ data, isLive = false }) => {
  const [memoryData, setMemoryData] = useState([]);
  
  useEffect(() => {
    if (data && data.memory && data.memory.history) {
      // Format data for the chart
      const formattedData = data.memory.history.map(point => ({
        time: new Date(point.time).toLocaleTimeString(),
        value: parseFloat(bytesToGB(point.value)),
        rawValue: point.value
      }));
      
      setMemoryData(formattedData);
    }
  }, [data]);
  
  // Custom formatter for the tooltip
  const formatTooltip = (value) => [`${value} GB`, 'Memory Usage'];

  // Calculate percentage for the progress bar
  const memoryPercentage = data && data.memory ? 
    (data.memory.used / data.memory.total) * 100 : 0;

  return (
    <div className="card p-4 h-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Memory Utilization</h3>
        {isLive && (
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
          </span>
        )}
      </div>
      
      {data && data.memory ? (
        <>
          <div className="flex mb-2">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Used</p>
              <p className="text-2xl font-semibold">{formatMemory(data.memory.used)}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-semibold">{formatMemory(data.memory.total)}</p>
            </div>
          </div>
          
          {/* Memory usage progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${memoryPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-right mb-2">
            {memoryPercentage.toFixed(1)}% used
          </p>
        </>
      ) : (
        <div className="mb-4 h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      )}
      
      <div className="h-44">
        {memoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={memoryData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                stroke="#6B7280"
              />
              <YAxis 
                domain={['dataMin', 'dataMax']} 
                tick={{ fontSize: 10 }}
                stroke="#6B7280"
                tickFormatter={(value) => `${value} GB`}
              />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                  border: 'none',
                  borderRadius: '4px',
                  color: '#F3F4F6'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={!isLive}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        )}
      </div>
    </div>
  );
};

MemoryChart.propTypes = {
  data: PropTypes.shape({
    memory: PropTypes.shape({
      total: PropTypes.number,
      used: PropTypes.number,
      history: PropTypes.arrayOf(
        PropTypes.shape({
          time: PropTypes.number,
          value: PropTypes.number
        })
      )
    })
  }),
  isLive: PropTypes.bool
};

export default MemoryChart;