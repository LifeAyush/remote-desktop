import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
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
    if (data && Array.isArray(data)) {
      // Format data for the chart
      const formattedData = data.map(point => ({
        time: new Date(point.time).toLocaleTimeString(),
        used: parseFloat(bytesToGB(point.used)),
        free: parseFloat(bytesToGB(point.free)),
        total: parseFloat(bytesToGB(point.total))
      }));
      
      setMemoryData(formattedData);
    }
  }, [data]);
  
  // Custom formatter for the tooltip
  const formatTooltip = (value, name) => {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    return [`${value} GB`, `${capitalizedName}`];
  };

  return (
    <div className="h-48 w-full">
      {memoryData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={memoryData}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="used" 
              name="Used"
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={!isLive}
            />
            <Line 
              type="monotone" 
              dataKey="free" 
              name="Free"
              stroke="#10B981" 
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={!isLive}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              name="Total"
              stroke="#6B7280" 
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={!isLive}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      )}
    </div>
  );
};

MemoryChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      total: PropTypes.number,
      used: PropTypes.number,
      free: PropTypes.number
    })
  ),
  isLive: PropTypes.bool
};

export default MemoryChart;