import React, { useEffect, useState } from 'react';
import type { Antistic, AntisticListResponse, Category } from '../types';
import api from '../config/api';
import AntisticCard from '../components/AntisticCard';
import Button from '../components/Button';

const Home: React.FC = () => {
  const [antistics, setAntistics] = useState<Antistic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAntistics();
  }, [page, searchQuery, selectedCategory]);

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
      const params: any = { page, pageSize: 20 };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="text-9xl mb-6 animate-pulse filter grayscale">⚖️</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="text-3xl font-light text-gray-700 mt-16">
            Szukamy odcieni prawdy...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
      
      {/* Centered content container - narrower like Demotywatory */}
      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        {/* Hero Section - Embracing Nuance */}
        <div className="text-center mb-16 relative">
          {/* Gradient orbs representing shades */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-gray-400/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-radial from-gray-600/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            {/* Main Title - representing the spectrum */}
            <div className="mb-6">
              <h1 className="text-7xl md:text-8xl font-black mb-4 relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
                  Antystyki
                </span>
              </h1>
              <div className="flex items-center justify-center gap-4 text-4xl">
                <span className="text-white">⬛</span>
                <span className="text-gray-700">◼️</span>
                <span className="text-gray-500">◼️</span>
                <span className="text-gray-400">◼️</span>
                <span className="text-gray-300">◼️</span>
                <span className="text-gray-200">◼️</span>
                <span className="text-white">⬜</span>
              </div>
            </div>

            <p className="text-2xl md:text-3xl font-light text-gray-700 mb-4 max-w-4xl mx-auto leading-relaxed">
              Świat nie jest <span className="text-black font-bold">czarno-biały</span>
            </p>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Odkrywaj odcienie prawdy • Kwestionuj polaryzację • Myśl krytycznie
            </p>

            {/* The spectrum bar */}
            <div className="max-w-2xl mx-auto mb-4">
              <div className="h-3 rounded-full bg-gradient-to-r from-black via-gray-400 to-white shadow-2xl border border-gray-600"></div>
              <div className="flex justify-between text-sm text-gray-400 mt-3">
                <span className="font-medium">Skrajność</span>
                <span className="text-gray-200 font-bold">Niuans</span>
                <span className="font-medium">Skrajność</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Compact */}
        <div className="mb-8">
          <div className="relative group">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Szukaj między ekstremami..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-6 py-4 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:border-gray-600 focus:outline-none transition-all shadow-lg"
              />
              <div className="absolute right-4 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters - Compact horizontal */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleCategoryFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-gray-800 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-500 hover:text-gray-800'
              }`}
            >
              ⚖️ Wszystkie
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-500 hover:text-gray-800'
                }`}
              >
                {category.namePl}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {antistics.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="text-6xl animate-bounce filter grayscale">🤔</div>
              <div className="absolute -top-4 -right-4 text-4xl animate-pulse">⚖️</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {searchQuery || selectedCategory 
                ? 'W tej perspektywie nic nie znaleziono' 
                : 'Jeszcze tu pusto'}
            </h3>
            <p className="text-gray-600 text-base mb-6 max-w-lg mx-auto leading-relaxed">
              {searchQuery || selectedCategory 
                ? 'Prawda może kryć się w innym odcieniu. Spróbuj zmienić perspektywę.' 
                : 'Każda historia ma wiele stron. Bądź pierwszym, który pokaże inną perspektywę.'}
            </p>
            {(searchQuery || selectedCategory) ? (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                variant="primary"
                size="md"
                icon="🔄"
              >
                Zobacz wszystkie perspektywy
              </Button>
            ) : (
              <Button
                to="/create"
                variant="primary"
                size="md"
                icon="✍️"
              >
                Pokaż inny punkt widzenia
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="primary"
                  size="md"
                  icon="←"
                >
                  Poprzednie
                </Button>
                
                <div className="px-6 py-3 bg-white rounded-lg shadow-lg border border-gray-300">
                  <span className="text-gray-700 font-bold">
                    <span className="text-gray-900">{page}</span>
                    <span className="text-gray-500 mx-2">/</span>
                    <span className="text-gray-600">{totalPages}</span>
                  </span>
                </div>
                
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="primary"
                  size="md"
                  icon="→"
                >
                  Następne
                </Button>
              </div>
            )}
          </>
        )}

        {/* Footer message */}
        <div className="mt-16 text-center pb-8">
          <p className="text-gray-600 text-sm italic max-w-lg mx-auto leading-relaxed">
            "Rzeczywistość rzadko jest czarno-biała. Odkrywajmy odcienie, które media pomijają."
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
