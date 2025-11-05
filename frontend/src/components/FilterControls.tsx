import React, { useEffect, useMemo, useState } from 'react';
import type { Category } from '../types';

interface FilterControlsProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  isFiltering?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearch,
  isFiltering = false,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(selectedCategory);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    setPendingCategory(selectedCategory);
  }, [selectedCategory]);

  const activeCategoryLabel = useMemo(() => {
    if (!selectedCategory) {
      return 'Wszystkie tematy';
    }
    return categories.find((category) => category.id === selectedCategory)?.namePl ?? 'Wszystkie tematy';
  }, [categories, selectedCategory]);

  const openFilters = () => setIsFilterOpen(true);
  const closeFilters = () => setIsFilterOpen(false);

  const applyFilters = () => {
    onCategorySelect(pendingCategory);
    closeFilters();
  };

  const resetFilters = () => {
    setPendingCategory('');
    onCategorySelect('');
    closeFilters();
  };

  const handleSearchToggle = () => {
    if (isSearchExpanded) {
      onSearch('');
    }
    setIsSearchExpanded((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-white text-sm font-medium shadow-sm transition-colors ${
              isFiltering
                ? 'border-gray-900 text-gray-900'
                : 'border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            <svg
              className={`w-4 h-4 ${isFiltering ? 'text-gray-900' : 'text-gray-500'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M6 12h12" />
              <path d="M10 18h4" />
            </svg>
            Filtry
            {isFiltering && (
              <span
                className="inline-flex w-2.5 h-2.5 rounded-full bg-gray-900"
                aria-hidden="true"
              />
            )}
          </button>
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {selectedCategory ? `#${activeCategoryLabel.replace(/\s+/g, '')}` : activeCategoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSearchExpanded ? (
            <button
              type="button"
              onClick={handleSearchToggle}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Zamknij
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSearchToggle}
            className={`w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors ${
              isSearchExpanded ? 'shadow-md' : 'shadow-sm'
            }`}
            aria-label={isSearchExpanded ? 'Zamknij wyszukiwarkę' : 'Otwórz wyszukiwarkę'}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {isSearchExpanded && (
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Szukaj antystyk..."
            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-900 shadow-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition"
          />
        </div>
      )}

      {isFilterOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeFilters}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 md:top-1/2 md:left-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2">
            <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-h-[80vh] overflow-y-auto md:max-w-md md:mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Wybierz kategorię</h2>
                  <p className="text-sm text-gray-500">Dopasuj feed do interesującego Cię tematu.</p>
                </div>
                <button
                  type="button"
                  onClick={closeFilters}
                  className="text-sm text-gray-400 hover:text-gray-700"
                  aria-label="Zamknij filtry"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => setPendingCategory('')}
                  className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                    pendingCategory === ''
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  Wszystkie tematy
                </button>

                {categories.map((category) => {
                  const isActive = pendingCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setPendingCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                        isActive ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      #{category.namePl.replace(/\s+/g, '')}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800 underline-offset-4 hover:underline"
                >
                  Wyczyść
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold shadow hover:bg-black"
                >
                  Zastosuj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;


