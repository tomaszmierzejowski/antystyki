import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Antystyki Logo Component
 * Renders the exact provided SVG from public to preserve 1:1 fidelity.
 */
const Logo: React.FC<LogoProps> = ({ size = 32, className = '', alt = 'Antystyki logo' }) => {
  return (
    <img
      src="/brand-logo.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: 'inline-block' }}
      loading="eager"
      decoding="async"
    />
  );
};

export default Logo;


