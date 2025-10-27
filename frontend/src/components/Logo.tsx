import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Antystyki Logo Component
 * Split circle (left bright, right dark) with Inter font "A"
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
      
      {/* Orange "A" letter using Inter font (same as site logo) */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontSize="60"
        fontFamily="Inter, sans-serif"
        fontWeight="600"
        fill="#FF6A00"
      >
        A
      </text>
    </svg>
  );
};

export default Logo;

