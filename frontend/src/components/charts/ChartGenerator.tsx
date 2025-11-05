/**
 * Chart Generator Component
 * 
 * Generates donut charts based on user-provided data
 * Supports multiple chart types and color schemes
 */

import React from 'react';
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
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Main segment */}
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke={mainSegment.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={mainOffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center text */}
        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{mainSegment.percentage}%</span>
          </div>
        )}
      </div>
      
      {/* Label */}
      <p className="mt-3 text-xs text-gray-600 text-center max-w-[180px]">
        {mainSegment.label}
      </p>
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
              <circle
                key={index}
                cx={size/2}
                cy={size/2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="mt-3 space-y-1">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-gray-600">{segment.label}</span>
              <span className="font-semibold text-gray-900">{segment.percentage}%</span>
            </div>
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
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="truncate pr-2" title={item.label}>
              {item.label}
            </span>
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              {item.displayValue}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, item.percentageWidth))}%`,
                backgroundColor: item.color,
              }}
            ></div>
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
}> = ({ points, unit, color = '#2563eb', height = 180 }) => {
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
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Axes */}
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX / 2} y2={height - paddingY} stroke="#e5e7eb" strokeWidth={1} />

        {/* Filled Area */}
        <path
          d={`${pathD} L ${toX(points.length - 1)} ${height - paddingY} L ${toX(0)} ${height - paddingY} Z`}
          fill={`url(#${gradientId})`}
        />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={toX(index)} cy={toY(point.value)} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
            <text
              x={toX(index)}
              y={toY(point.value) - 10}
              textAnchor="middle"
              fill="#111827"
              fontSize={10}
              fontWeight={600}
            >
              {`${point.value.toLocaleString('pl-PL', {
                minimumFractionDigits: point.value % 1 === 0 ? 0 : 1,
                maximumFractionDigits: 2,
              })}${unit ? unit.replace(/^\s*/, ' ') : ''}`}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={`${point.label}-label-${index}`}
            x={toX(index)}
            y={height - paddingY + 18}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={10}
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
                stroke="#d1d5db"
                strokeWidth={1}
              />
              <text
                x={paddingX - 8}
                y={toY(value) + 4}
                textAnchor="end"
                fill="#9ca3af"
                fontSize={10}
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
