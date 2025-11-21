import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import type { Antistic, AntisticListResponse, Category, Statistic } from '../types';
import api from '../config/api';
import AntisticCard from '../components/AntisticCard';
import HeroSection from '../components/HeroSection';
import LoadMoreButton from '../components/LoadMoreButton';
import Footer from '../components/Footer';
import CardSkeleton from '../components/CardSkeleton';
import FilterControls from '../components/FilterControls';
import StatisticsHub from '../components/StatisticsHub';
import AdSlot from '../components/AdSlot';
import { trackCategoryFilter, trackEvent, trackLoadMore, trackSearch } from '../utils/analytics';

/**
 * Home Page - Completely refactored to match mockup design
 * 
 * Layout structure:
 * 1. HeroSection (heading, CTA, view toggle)
 * 2. FilterControls (compact filters + search)
 * 3. Antystyki feed or Statystyki hub depending on active view
 * 4. LoadMoreButton (Antystyki view only)
 * 5. Footer
 * 
 * Design: Clean, minimal, light-gray aesthetic with generous whitespace
 */
type HomeView = 'antistics' | 'statistics';
type HomeViewChangeMethod = 'toggle' | 'swipe' | 'filter' | 'hashtag';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [antistics, setAntistics] = useState<Antistic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'top' | 'trending'>('latest');
  const [activeView, setActiveView] = useState<HomeView>('antistics');
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filtersVersion, setFiltersVersion] = useState(0);
  const headerAdSlot = import.meta.env.VITE_ADSENSE_HEADER_SLOT ?? '';
  const inFeedAdSlot = import.meta.env.VITE_ADSENSE_IN_FEED_SLOT ?? '';

  const isFiltering = useMemo(() => Boolean(selectedCategory || searchQuery), [searchQuery, selectedCategory]);

  const changeView = useCallback(
    (nextView: HomeView, method: HomeViewChangeMethod, metadata: Record<string, unknown> = {}) => {
      setActiveView((previous) => {
        if (previous === nextView) {
          return previous;
        }

        trackEvent('home_view_change', {
          from_view: previous,
          to_view: nextView,
          method,
          ...metadata,
        });

        return nextView;
      });
    },
    [],
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => changeView('statistics', 'swipe', { direction: 'left' }),
    onSwipedRight: () => changeView('antistics', 'swipe', { direction: 'right' }),
    delta: 40,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchAntistics = useCallback(async () => {
    const requestPage = page;
    const isFirstPage = requestPage === 1;

    try {
      if (isFirstPage) {
        setLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      const params: Record<string, unknown> = { page: requestPage, pageSize: 20, sortBy };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;

      const response = await api.get<AntisticListResponse>('/antistics', { params });

      setAntistics((previous) => {
        if (isFirstPage) {
          return response.data.items;
        }

        const existingIds = new Set(previous.map((item) => item.id));
        const merged = response.data.items.filter((item) => !existingIds.has(item.id));
        return [...previous, ...merged];
      });

      setTotalPages(Math.ceil(response.data.totalCount / response.data.pageSize));
    } catch (error) {
      console.error('Error fetching antistics:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [page, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeView !== 'antistics') {
      return;
    }
    fetchAntistics();
  }, [activeView, fetchAntistics, filtersVersion]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    setAntistics([]);
    setFiltersVersion((previous) => previous + 1);
    setLoading(true);

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      trackSearch(trimmed);
    }
  };

  const applyCategoryFilter = useCallback(
    (categoryId: string, source: 'filters' | 'card', { allowToggle } = { allowToggle: true }) => {
      const isSameCategory = selectedCategory === categoryId;
      const nextCategory = allowToggle && isSameCategory ? '' : categoryId;

      if (activeView !== 'antistics') {
        changeView('antistics', source === 'card' ? 'hashtag' : 'filter');
      }

      if (nextCategory !== selectedCategory) {
        setSelectedCategory(nextCategory);
        setAntistics([]);
        setPage(1);
        setFiltersVersion((previous) => previous + 1);
        setLoading(true);

        trackCategoryFilter(nextCategory || 'all');
      } else if (!allowToggle && isSameCategory) {
        // Force refresh when clicking same hashtag repeatedly without toggling
        setPage(1);
        setAntistics((previous) => [...previous]);
        setFiltersVersion((previous) => previous + 1);
        setLoading(true);
      }
    },
    [activeView, changeView, selectedCategory],
  );

  const handleSortChange = (newSortBy: 'latest' | 'top' | 'trending') => {
    setSortBy(newSortBy);
    setPage(1);
    setAntistics([]);
    setFiltersVersion((previous) => previous + 1);
    setLoading(true);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      trackLoadMore(page + 1);
      setPage((previous) => previous + 1);
    }
  };

  const handleViewChange = (view: HomeView) => {
    changeView(view, 'toggle');
  };

  const handleStatisticsConvertNavigation = (statistic: Statistic) => {
    navigate('/create', { state: { fromStatisticId: statistic.id } });
  };

  const renderAntisticsContent = () => {
    if (loading && page === 1) {
      return (
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (antistics.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="text-6xl mb-6 opacity-50">🤔</div>
          <h3 className="text-2xl font-semibold text-text-primary mb-3">
            {searchQuery || selectedCategory
              ? 'Nie znaleziono wyników'
              : 'Jeszcze tu pusto'}
          </h3>
          <p className="text-text-secondary text-base mb-6 max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedCategory
              ? 'Spróbuj zmienić filtry lub wyszukiwane hasło.'
              : 'Bądź pierwszym, który doda antystyk.'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-8">
          {antistics.map((antistic, index) => (
            <Fragment key={antistic.id}>
              <div
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in-up"
              >
                <AntisticCard
                  antistic={antistic}
                  onAdminAction={fetchAntistics}
                  onCategoryClick={(categoryId) =>
                    applyCategoryFilter(categoryId, 'card', { allowToggle: false })
                  }
                />
              </div>

              {inFeedAdSlot && index === 2 && (
                <AdSlot
                  key={`home-feed-ad-${index}`}
                  slotId={inFeedAdSlot}
                  className="my-10"
                  format="auto"
                />
              )}
            </Fragment>
          ))}
        </div>

        {totalPages > page && (
          <LoadMoreButton
            onClick={handleLoadMore}
            loading={loading || isFetchingMore}
            disabled={page >= totalPages}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background" {...swipeHandlers}>
      <HeroSection activeView={activeView} onViewChange={handleViewChange} />

      <main className="mx-auto px-6 py-8 max-w-[1000px]">
        {activeView === 'antistics' ? (
          <>
            <FilterControls
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={(categoryId) => applyCategoryFilter(categoryId, 'filters')}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              isFiltering={isFiltering}
            />

            {headerAdSlot && (
              <AdSlot
                key="home-header-ad"
                slotId={headerAdSlot}
                className="mb-6"
                format="auto"
              />
            )}

            <div className="flex gap-1 mb-6 bg-background/50 p-1 rounded-lg border border-border-subtle backdrop-blur-sm">
              {[
                { key: 'latest', label: 'Najnowsze' },
                { key: 'top', label: 'Najwyżej oceniane' },
                { key: 'trending', label: 'Na fali' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key as 'latest' | 'top' | 'trending')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${sortBy === key
                      ? 'bg-card text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background/50'
                    }`}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {renderAntisticsContent()}
          </>
        ) : (
          <div className="pt-2">
            <StatisticsHub
              variant="embedded"
              onNavigateToCreator={handleStatisticsConvertNavigation}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
