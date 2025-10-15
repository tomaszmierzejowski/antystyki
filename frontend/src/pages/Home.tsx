import React, { useEffect, useState } from 'react';
import type { Antistic, AntisticListResponse, Category } from '../types';
import api from '../config/api';
import AntisticCard from '../components/AntisticCard';
import HeroSection from '../components/HeroSection';
import TagFilterBar from '../components/TagFilterBar';
import LoadMoreButton from '../components/LoadMoreButton';
import Footer from '../components/Footer';
import CardSkeleton from '../components/CardSkeleton';

/**
 * Home Page - Completely refactored to match mockup design
 * 
 * Layout structure:
 * 1. HeroSection (large heading, buttons)
 * 2. TagFilterBar (pill-style filters with optional search)
 * 3. Feed of AntisticCards (center column, ~900-1000px wide)
 * 4. LoadMoreButton
 * 5. Footer
 * 
 * Design: Clean, minimal, light-gray aesthetic with generous whitespace
 */
const Home: React.FC = () => {
  const [antistics, setAntistics] = useState<Antistic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'top' | 'trending'>('latest');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAntistics();
  }, [page, searchQuery, selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAntistics = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize: 20, sortBy };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      
      const response = await api.get<AntisticListResponse>('/antistics', { params });
      
      setAntistics(response.data.items);
      setTotalPages(Math.ceil(response.data.totalCount / response.data.pageSize));
    } catch (error) {
      console.error('Error fetching antistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setPage(1);
  };

  const handleSortChange = (newSortBy: 'latest' | 'top' | 'trending') => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
        <HeroSection />
        <main className="mx-auto px-6 py-8" style={{ maxWidth: '1000px' }}>
          <div className="space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      {/* Hero Section - Large centered heading with buttons */}
      <HeroSection />
      
      {/* Main Content Container - Center column feed (~900-1000px wide max) */}
      <main className="mx-auto px-6 py-8" style={{ maxWidth: '1000px' }}>
        {/* Tag Filter Bar - Pill-style buttons */}
        <TagFilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategoryFilter}
          searchQuery={searchQuery}
          onSearch={handleSearch}
        />

        {/* Sort Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'latest', label: 'Latest' },
            { key: 'top', label: 'Top' },
            { key: 'trending', label: 'Trending' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSortChange(key as 'latest' | 'top' | 'trending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                sortBy === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        {antistics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 opacity-50">🤔</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {searchQuery || selectedCategory 
                ? 'Nie znaleziono wyników' 
                : 'Jeszcze tu pusto'}
            </h3>
            <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory 
                ? 'Spróbuj zmienić filtry lub wyszukiwane hasło.' 
                : 'Bądź pierwszym, który doda antystyk.'}
            </p>
          </div>
        ) : (
          <>
            {/* Feed of Cards - Single column for clean layout */}
            <div className="space-y-8">
              {antistics.map((antistic, index) => (
                <div
                  key={antistic.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-fade-in-up"
                >
                  <AntisticCard antistic={antistic} />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {totalPages > page && (
              <LoadMoreButton
                onClick={handleLoadMore}
                loading={loading}
                disabled={page >= totalPages}
              />
            )}
          </>
        )}
      </main>

      {/* Footer - Three-column layout */}
      <Footer />
    </div>
  );
};

export default Home;
