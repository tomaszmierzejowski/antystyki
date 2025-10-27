import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Antystyki Logo Component
 * Orange "A" on gray circular background
 * Based on the brand design
 */
const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gray circular background with gradient (light to dark) */}
      <defs>
        <linearGradient id="grayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D1D5DB" />
          <stop offset="100%" stopColor="#6B7280" />
        </linearGradient>
      </defs>
      
      {/* Circle background */}
      <circle cx="50" cy="50" r="50" fill="url(#grayGradient)" />
      
      {/* Orange "A" letter */}
      <path
        d="M 35 75 L 45 35 L 55 35 L 65 75 L 58 75 L 56 65 L 44 65 L 42 75 Z M 45.5 58 L 54.5 58 L 50 40 Z"
        fill="#FF6A00"
        stroke="#FF6A00"
        strokeWidth="1"
      />
    </svg>
  );
};

export default Logo;

