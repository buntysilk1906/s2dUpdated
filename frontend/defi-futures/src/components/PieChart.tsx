import React from 'react';
import { motion } from 'framer-motion';

interface PieChartProps {
  percentage: number;
  label: string;
  size?: number;
}

const PieChart: React.FC<PieChartProps> = ({ percentage, label, size = 200 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(185, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(270, 91%, 65%)" />
          </linearGradient>
        </defs>
      </svg>
      <motion.div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-3xl font-bold gradient-text">{percentage}%</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </motion.div>
    </div>
  );
};

export default PieChart;
