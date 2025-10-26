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

/**
 * Utility function to generate segments from user data
 */
export const generateSegmentsFromData = (
  data: Array<{ label: string; percentage: number }>,
  colorPalette: string[] = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']
): ChartSegment[] => {
  return data.map((item, index) => ({
    ...item,
    color: colorPalette[index % colorPalette.length]
  }));
};

/**
 * Utility function to create perspective data
 */
export const createPerspectiveData = (
  mainPercentage: number,
  mainLabel: string,
  secondaryLabel: string = 'Pozostałe',
  color: string = '#6b7280'
) => {
  return [
    {
      label: mainLabel,
      percentage: mainPercentage,
      color: color
    },
    {
      label: secondaryLabel,
      percentage: 100 - mainPercentage,
      color: '#e5e7eb'
    }
  ];
};

export default { DoughnutChart, ColorfulDataChart, generateSegmentsFromData, createPerspectiveData };
