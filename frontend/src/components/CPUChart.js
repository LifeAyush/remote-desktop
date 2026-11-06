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

const CPUChart = ({ data, isLive = false }) => {
  const [cpuData, setCpuData] = useState([]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Format the data for the chart
      const formattedData = data.map(point => ({
        time: new Date(point.time).toLocaleTimeString(),
        total: parseFloat(point.total.toFixed(1)),
        user: parseFloat(point.user.toFixed(1)),
        system: parseFloat(point.system.toFixed(1)),
        idle: parseFloat(point.idle.toFixed(1))
      }));
      
      setCpuData(formattedData);
    }
  }, [data]);

  const formatTooltip = (value, name) => {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    return [`${value}%`, `${capitalizedName}`];
  };

  return (
    <div className="h-48 w-full">
      {cpuData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={cpuData}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              name="Total"
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={!isLive}
            />
            <Line 
              type="monotone" 
              dataKey="user" 
              name="User"
              stroke="#10B981" 
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={!isLive}
            />
            <Line 
              type="monotone" 
              dataKey="system" 
              name="System"
              stroke="#F59E0B" 
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={!isLive}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      )}
    </div>
  );
};

CPUChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      total: PropTypes.number,
      user: PropTypes.number,
      system: PropTypes.number,
      idle: PropTypes.number
    })
  ),
  isLive: PropTypes.bool
};

export default CPUChart;