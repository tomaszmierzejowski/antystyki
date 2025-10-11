import React from 'react';
import type { Antistic } from '../types';
import { Link } from 'react-router-dom';

/**
 * AntisticCard Component - Completely refactored to match mockup design
 * 
 * Design characteristics:
 * - Two-column layout with charts
 * - Left: "Perspektywa Antystyki" - gray doughnut chart
 * - Right: "Dane źródłowe" - colorful data chart
 * - Below: context/explanation paragraph
 * - Interaction bar with icons (likes, comments, share)
 * - Bottom-right watermark: "antystyki.pl" (semi-transparent)
 * - Rounded corners (rounded-2xl), light gray border, soft shadow
 */

interface Props {
  antistic: Antistic;
}

/**
 * Simple SVG Doughnut Chart Component
 * Creates a circular chart to represent data visually
 */
const DoughnutChart: React.FC<{ percentage: number; color: string; label: string }> = ({ 
  percentage, 
  color,
  label 
}) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="transform -rotate-90" width="160" height="160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="20"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={color}
            strokeWidth="20"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-600 text-center max-w-[180px]">{label}</p>
    </div>
  );
};

/**
 * Colorful Data Chart Component
 * Represents source data with multiple colored segments
 */
const ColorfulDataChart: React.FC<{ segments: Array<{ label: string; percentage: number; color: string }> }> = ({ segments }) => {
  const radius = 60;
  let cumulativePercentage = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="transform -rotate-90" width="160" height="160">
          {segments.map((segment, index) => {
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -(cumulativePercentage / 100) * circumference;
            cumulativePercentage += segment.percentage;

            return (
              <circle
                key={index}
                cx="80"
                cy="80"
                r={radius}
                stroke={segment.color}
                strokeWidth="20"
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
      <div className="mt-3 space-y-1">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: segment.color }}></div>
            <span className="text-gray-600">{segment.label}</span>
            <span className="font-semibold text-gray-900">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AntisticCard: React.FC<Props> = ({ antistic }) => {
  // Mock data for charts (in real app, this would come from antistic data)
  const perspectivePercentage = 92; // Example: 92.4% from mockup
  
  const sourceData = [
    { label: 'Jazda po chodniku', percentage: 7, color: '#ef4444' },
    { label: 'Nieostrożna jazda', percentage: 28, color: '#f97316' },
    { label: 'Nieuważna jazda', percentage: 25, color: '#3b82f6' },
    { label: 'Niewłaściwa pozycja', percentage: 18, color: '#10b981' },
    { label: 'Zdrowy rozsądek', percentage: 14, color: '#8b5cf6' },
    { label: 'Pozostałe', percentage: 7, color: '#eab308' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 transition-shadow overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
         onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
         onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}>
      {/* Title Bar - if needed */}
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{antistic.title}</h3>
        <p className="text-sm text-gray-600">{perspectivePercentage}% wypadków drogowych powodują trzeźwi kierowcy</p>
      </div>

      {/* Two-column chart section */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Left Column: Perspektywa Antystyki */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Perspektywa Antystyki</h4>
            <DoughnutChart 
              percentage={perspectivePercentage}
              color="#6b7280"
              label={`${perspectivePercentage}% wypadków powodują trzeźwi kierowcy`}
            />
          </div>

          {/* Right Column: Dane źródłowe */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Dane źródłowe</h4>
            <ColorfulDataChart segments={sourceData} />
          </div>
        </div>

        {/* Context paragraph */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {antistic.reversedStatistic || 'Podczas gdy media skupiają się na pijanym kierowcy, większość wypadków drogowych powodują trzeźwi kierowcy, warto pamiętać o pozostałych przyczynach.'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Źródło: {antistic.originalStatistic || 'WHO Global Status Report'}
          </p>
        </div>

        {/* Interaction bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Likes */}
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-accent transition-colors group">
              <span className="text-base group-hover:scale-110 transition-transform">👍</span>
              <span className="text-sm font-medium">{antistic.likesCount}</span>
              <span className="text-xs">Lubię to</span>
            </button>

            {/* Comments - placeholder */}
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-accent transition-colors group">
              <span className="text-base group-hover:scale-110 transition-transform">💬</span>
              <span className="text-sm font-medium">45</span>
              <span className="text-xs">Udostępnij</span>
            </button>
          </div>

          {/* Watermark - bottom right, semi-transparent */}
          <div className="text-xs text-gray-300 font-medium">
            antystyki.pl
          </div>
        </div>
      </div>

      {/* Categories - if needed */}
      {antistic.categories && antistic.categories.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {antistic.categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
            >
              {cat.namePl}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AntisticCard;
