import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Antystyki Logo Component
 * Simple circular gradient with orange "A"
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
      {/* Gray gradient circle background */}
      <defs>
        <linearGradient id="grayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
      </defs>
      
      {/* Circle background with gradient */}
      <circle cx="50" cy="50" r="50" fill="url(#grayGradient)" />
      
      {/* Orange "A" letter - large and centered */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontSize="65"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
        fill="#FF6A00"
      >
        A
      </text>
    </svg>
  );
};

export default Logo;

