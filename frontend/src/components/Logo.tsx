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
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <img
        src="/brand-logo.svg"
        alt={alt}
        width={size}
        height={size}
        className="dark:hidden w-full h-full object-contain"
        loading="eager"
        decoding="async"
      />
      <img
        src="/brand-logo-dark.svg"
        alt={alt}
        width={size}
        height={size}
        className="hidden dark:block w-full h-full object-contain"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default Logo;


