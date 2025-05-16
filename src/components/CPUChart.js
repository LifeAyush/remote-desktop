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

const CPUChart = ({ data, isLive = false }) => {
  const [cpuData, setCpuData] = useState([]);

  useEffect(() => {
    if (data && data.cpu && data.cpu.history) {
      // Format the data for the chart
      const formattedData = data.cpu.history.map(point => ({
        time: new Date(point.time).toLocaleTimeString(),
        value: parseFloat(point.value.toFixed(1))
      }));
      
      setCpuData(formattedData);
    }
  }, [data]);

  const formatTooltip = (value) => [`${value}%`, 'CPU Usage'];

  return (
    <div className="card p-4 h-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">CPU Utilization</h3>
        {isLive && (
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
          </span>
        )}
      </div>
      
      {data && data.cpu ? (
        <div className="flex mb-4">
          <div className="text-center flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-2xl font-semibold">{data.cpu.usage_percent.toFixed(1)}%</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Cores</p>
            <p className="text-2xl font-semibold">{data.cpu.cores}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      )}
      
      <div className="h-48">
        {cpuData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={cpuData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                stroke="#6B7280"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }} 
                stroke="#6B7280"
                tickFormatter={(value) => `${value}%`}
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
                stroke="#3B82F6" 
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

CPUChart.propTypes = {
  data: PropTypes.shape({
    cpu: PropTypes.shape({
      usage_percent: PropTypes.number,
      cores: PropTypes.number,
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

export default CPUChart;