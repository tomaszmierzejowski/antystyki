import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Antystyki Logo Component
 * Split circle (left bright, right dark) with large orange "A"
 * Represents "shades of gray" - not black and white
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
      {/* Left half - Bright gray */}
      <path
        d="M 50 0 A 50 50 0 0 1 50 100 L 50 50 Z"
        fill="#D1D5DB"
      />
      
      {/* Right half - Dark gray */}
      <path
        d="M 50 0 A 50 50 0 0 0 50 100 L 50 50 Z"
        fill="#6B7280"
      />
      
      {/* Large orange "A" letter */}
      <path
        d="M 30 80 L 42 25 L 58 25 L 70 80 L 60 80 L 57.5 67 L 42.5 67 L 40 80 Z M 45 57 L 55 57 L 50 35 Z"
        fill="#FF6A00"
        stroke="#FF6A00"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default Logo;

