/**
 * Chart Generator Component
 * 
 * Generates donut charts based on user-provided data
 * Supports multiple chart types and color schemes
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ChartSegment } from '../../types/templates';

interface DoughnutChartProps {
  segments: ChartSegment[];
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

interface ColorfulChartProps {
  segments: ChartSegment[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  className?: string;
}

/**
 * Simple Doughnut Chart - for perspective data (left side)
 * Shows one main segment vs. the rest
 */
export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  segments,
  size = 160,
  strokeWidth = 20,
  showPercentage = true,
  className = ""
}) => {
  if (!segments.length) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // For simple charts, we expect 2 segments: main + secondary
  const mainSegment = segments[0];
  const mainOffset = circumference - (mainSegment.percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-30"
          />
          {/* Main segment */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: mainOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={mainSegment.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>

        {/* Center text */}
        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-3xl font-bold text-text-primary font-display"
            >
              {mainSegment.percentage}%
            </motion.span>
          </div>
        )}
      </div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-3 text-xs text-text-secondary text-center max-w-[180px] font-medium"
      >
        {mainSegment.label}
      </motion.p>
    </div>
  );
};

/**
 * Colorful Multi-Segment Chart - for source data (right side)
 * Shows multiple segments with legend
 */
export const ColorfulDataChart: React.FC<ColorfulChartProps> = ({
  segments,
  size = 160,
  strokeWidth = 20,
  showLegend = true,
  className = ""
}) => {
  if (!segments.length) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative percentages for positioning
  let cumulativePercentage = 0;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {segments.map((segment, index) => {
            const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -(cumulativePercentage / 100) * circumference;
            cumulativePercentage += segment.percentage;

            return (
              <motion.circle
                key={index}
                initial={{ opacity: 0, strokeDasharray: `0 ${circumference}` }}
                animate={{ opacity: 1, strokeDasharray }}
                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 space-y-2 w-full max-w-[200px]">
          {segments.map((segment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: segment.color }}
                ></div>
                <span className="text-text-secondary font-medium truncate max-w-[120px]" title={segment.label}>
                  {segment.label}
                </span>
              </div>
              <span className="font-bold text-text-primary">{segment.percentage}%</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BarChart: React.FC<{
  items: Array<{
    label: string;
    displayValue: string;
    percentageWidth: number;
    color: string;
  }>;
}> = ({ items }) => {
  if (!items.length) return null;

  return (
    <div className="space-y-3 w-full">
      {items.map((item, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="truncate pr-2 font-medium" title={item.label}>
              {item.label}
            </span>
            <span className="font-bold text-text-primary whitespace-nowrap">
              {item.displayValue}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, item.percentageWidth))}%` }}
              transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
              className="h-full rounded-full shadow-sm"
              style={{
                backgroundColor: item.color,
              }}
            ></motion.div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LineChart: React.FC<{
  points: Array<{ label: string; value: number }>;
  unit?: string;
  color?: string;
  height?: number;
}> = ({ points, unit, color = '#FF6A00', height = 180 }) => {
  if (!points.length) return null;

  const width = 360;
  const paddingX = 32;
  const paddingY = 24;

  const maxValue = Math.max(...points.map((p) => p.value));
  const minValue = Math.min(...points.map((p) => p.value));
  const valueRange = maxValue === minValue ? Math.max(1, Math.abs(maxValue)) : maxValue - minValue;

  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX * 2;

  const toX = (index: number) => {
    if (points.length === 1) return paddingX + chartWidth / 2;
    return paddingX + (chartWidth * index) / (points.length - 1);
  };
  const toY = (value: number) => {
    if (valueRange === 0) return paddingY + chartHeight / 2;
    return paddingY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(point.value)}`)
    .join(' ');

  const gradientId = `lineGradient-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="space-y-4 w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Axes */}
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="var(--border-color)" strokeWidth={1} />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX / 2} y2={height - paddingY} stroke="var(--border-color)" strokeWidth={1} />

        {/* Filled Area */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          d={`${pathD} L ${toX(points.length - 1)} ${height - paddingY} L ${toX(0)} ${height - paddingY} Z`}
          fill={`url(#${gradientId})`}
        />

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <motion.circle
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
              cx={toX(index)}
              cy={toY(point.value)}
              r={4}
              fill={color}
              stroke="var(--bg-card)"
              strokeWidth={2}
            />
            <motion.text
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
              x={toX(index)}
              y={toY(point.value) - 12}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize={10}
              fontWeight={600}
              className="font-sans"
            >
              {`${point.value.toLocaleString('pl-PL', {
                minimumFractionDigits: point.value % 1 === 0 ? 0 : 1,
                maximumFractionDigits: 2,
              })}${unit ? unit.replace(/^\s*/, ' ') : ''}`}
            </motion.text>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={`${point.label}-label-${index}`}
            x={toX(index)}
            y={height - paddingY + 18}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize={10}
            className="font-sans"
          >
            {point.label}
          </text>
        ))}

        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = minValue + valueRange * fraction;
          return (
            <g key={`tick-${fraction}`}>
              <line
                x1={paddingX - 4}
                y1={toY(value)}
                x2={paddingX}
                y2={toY(value)}
                stroke="var(--border-color)"
                strokeWidth={1}
              />
              <text
                x={paddingX - 8}
                y={toY(value) + 4}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize={10}
                className="font-sans"
              >
                {value.toLocaleString('pl-PL', {
                  minimumFractionDigits: Math.abs(value) < 1 ? 2 : 0,
                  maximumFractionDigits: 2,
                })}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default { DoughnutChart, ColorfulDataChart, BarChart, LineChart };
