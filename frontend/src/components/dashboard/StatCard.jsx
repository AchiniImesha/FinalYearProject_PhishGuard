import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from 'recharts';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  gradient,
  isLoading = false,
  onClick,
  className = "",
  trendData = []
}) => {
  // Use real trend data or generate fallback data
  const chartData = trendData.length > 0 ? trendData : [];

  const getGradientColors = () => {
    switch (gradient) {
      case 'primary':
        return { from: '#3B82F6', to: '#1D4ED8' };
      case 'danger':
        return { from: '#EF4444', to: '#DC2626' };
      case 'success':
        return { from: '#10B981', to: '#059669' };
      case 'warning':
        return { from: '#F59E0B', to: '#D97706' };
      case 'info':
        return { from: '#06B6D4', to: '#0891B2' };
      default:
        return { from: '#3B82F6', to: '#1D4ED8' };
    }
  };

  const colors = getGradientColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`${className} h-full`}
    >
      <div 
        className="bg-gray-900 rounded-xl p-4 h-full flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-2xl hover:bg-gray-800 border border-gray-800"
        onClick={onClick}
      >
        {/* Header with Icon and Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              {isLoading ? (
                <div className="h-4 w-4 bg-white/30 rounded animate-pulse"></div>
              ) : (
                <Icon className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium tracking-wide uppercase">
                {title}
              </p>
            </div>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-3">
          {isLoading ? (
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
          ) : (
            <h3 className="text-2xl font-bold text-white leading-tight">
              {value}
            </h3>
          )}
        </div>

        {/* Trend Chart */}
        <div className="flex-1 min-h-[50px]">
          {isLoading ? (
            <div className="h-full w-full bg-white/10 rounded animate-pulse"></div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                style={{ background: 'transparent' }}
              >
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.from} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={colors.from} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor={colors.from} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.from}
                  strokeWidth={2.5}
                  fill={`url(#gradient-${title})`}
                  dot={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-white/30 text-xs">No data available</p>
            </div>
          )}
        </div>

        {/* Change Indicator */}
        {change && !isLoading && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-white/60 text-xs font-medium">
              {change}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard; 