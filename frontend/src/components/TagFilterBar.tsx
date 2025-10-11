import React from 'react';
import type { Category } from '../types';

/**
 * TagFilterBar Component - Matches mockup design
 * 
 * Design characteristics:
 * - Horizontal list of pill-style buttons
 * - Selected tag: filled accent background
 * - Unselected: light gray background
 * - Rounded-full style with padding
 * - Optional search field on the right
 */

interface Props {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const TagFilterBar: React.FC<Props> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearch,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      {/* Tag Pills - Horizontal scrollable list */}
      <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
        {/* "All" button */}
        <button
          onClick={() => onCategorySelect('')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            !selectedCategory
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={!selectedCategory ? { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } : {}}
        >
          Wszystkie
        </button>

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={selectedCategory === category.id ? { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } : {}}
          >
            {category.namePl}
          </button>
        ))}
      </div>

      {/* Optional search field */}
      {onSearch !== undefined && (
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Szukaj..."
            value={searchQuery || ''}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full px-4 py-2 pr-10 text-sm bg-gray-100 border border-gray-200 rounded-full text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:outline-none transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilterBar;

