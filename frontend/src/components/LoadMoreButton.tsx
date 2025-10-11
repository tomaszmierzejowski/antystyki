import React from 'react';

/**
 * LoadMoreButton Component - Matches mockup design
 * 
 * Design characteristics:
 * - Center-aligned
 * - Rounded button with "Załaduj więcej" text
 * - Light-gray background
 * - Hover accent transition
 */

interface Props {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const LoadMoreButton: React.FC<Props> = ({ onClick, loading = false, disabled = false }) => {
  return (
    <div className="flex justify-center mt-12">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        {loading ? 'Ładowanie...' : 'Załaduj więcej'}
      </button>
    </div>
  );
};

export default LoadMoreButton;

