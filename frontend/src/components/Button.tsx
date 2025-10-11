import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  to,
  href,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-gray-700 to-gray-800 text-white border-2 border-gray-600 hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 shadow-lg hover:shadow-2xl',
    secondary: 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 border-2 border-gray-700 hover:text-white hover:border-gray-600 shadow-md hover:shadow-xl',
    outline: 'bg-transparent text-gray-400 border-2 border-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-600',
    ghost: 'bg-transparent text-gray-400 border-2 border-transparent hover:bg-gray-900 hover:text-white hover:border-gray-800',
    danger: 'bg-gradient-to-r from-red-900 to-red-800 text-white border-2 border-red-700 hover:from-red-800 hover:to-red-700 shadow-lg hover:shadow-2xl',
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-full font-semibold
    transition-all duration-300
    transform hover:scale-105 active:scale-95
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </>
  );

  // If it's a Link (internal navigation)
  if (to && !disabled) {
    return (
      <Link to={to} className={baseClasses}>
        {content}
      </Link>
    );
  }

  // If it's an external link
  if (href && !disabled) {
    return (
      <a href={href} className={baseClasses} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  // Regular button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {content}
    </button>
  );
};

export default Button;

