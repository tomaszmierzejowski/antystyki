import React from 'react';

const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      {/* Title Bar Skeleton */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 rounded-full w-12"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Chart Area Skeleton */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="h-2 bg-gray-200 rounded w-1/4 mt-3"></div>
      </div>

      {/* Interaction Bar Skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-6"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
};

export default CardSkeleton;
