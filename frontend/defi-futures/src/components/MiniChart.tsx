import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, color, height = 40 }) => {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniChart;
