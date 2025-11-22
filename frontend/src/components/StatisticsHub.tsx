import React, { useEffect, useMemo, useState } from 'react';
import StatisticCard from './StatisticCard';
import {
  fetchStatistics,
  voteOnStatistic,
  type StatisticsSortOption,
} from '../api/statistics';
import { buildAntisticPrefillFromStatistic } from '../utils/statisticPrefill';
import type { Statistic } from '../types';
import { trackEvent } from '../utils/analytics';

type Variant = 'standalone' | 'embedded';

interface StatisticsHubProps {
  variant?: Variant;
  className?: string;
  onNavigateToCreator: (statistic: Statistic) => void;
}

const PAGE_SIZE = 8;

const sortLabels: Record<StatisticsSortOption, string> = {
  top: 'Najwyżej oceniane',
  new: 'Najnowsze',
  views: 'Najczęściej oglądane',
};

const StatisticsHub: React.FC<StatisticsHubProps> = ({
  variant = 'standalone',
  className = '',
  onNavigateToCreator,
}) => {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<StatisticsSortOption>('top');
  const [voteBusyId, setVoteBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics(true);
    trackEvent('statistics_page_view', { sort, variant });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const loadStatistics = async (reset: boolean = false) => {
    try {
      setErrorMessage(null);
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const targetPage = reset ? 1 : page;
      const response = await fetchStatistics({ page: targetPage, pageSize: PAGE_SIZE, sort });

      setStatistics((prev) => {
        if (reset) {
          return response.items;
        }

        const merged = [...prev];
        response.items.forEach((item) => {
          if (!merged.some((existing) => existing.id === item.id)) {
            merged.push(item);
          }
        });
        return merged;
      });

      const hasNext = targetPage * response.pageSize < response.totalCount;
      setHasMore(hasNext);
      setPage(targetPage + 1);
    } catch (error) {
      console.error('Failed to load statistics', error);
      setErrorMessage('Nie udało się załadować statystyk. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleVote = async (statisticId: string, voteType: 'Like' | 'Dislike', remove: boolean) => {
    try {
      setVoteBusyId(statisticId);
      const response = await voteOnStatistic(statisticId, voteType, remove);

      setStatistics((prev) =>
        prev.map((stat) => {
          if (stat.id !== statisticId) {
            return stat;
          }

          const updated: Statistic = {
            ...stat,
            likeCount: response.likeCount,
            dislikeCount: response.dislikeCount,
          };

          if (voteType === 'Like') {
            updated.hasLiked = !remove;
            if (!remove) {
              updated.hasDisliked = false;
            }
          } else {
            updated.hasDisliked = !remove;
            if (!remove) {
              updated.hasLiked = false;
            }
          }

          return updated;
        })
      );

      trackEvent('statistic_vote', {
        statistic_id: statisticId,
        vote_type: voteType.toLowerCase(),
        action: remove ? 'remove' : 'add',
      });
    } catch (error: unknown) {
      console.error('Failed to update statistic vote', error);

      const unauthorized = typeof error === 'object'
        && error !== null
        && 'response' in error
        && typeof (error as { response?: { status?: number } }).response?.status === 'number'
        && (error as { response?: { status?: number } }).response?.status === 401;

      const message = unauthorized
        ? 'Zaloguj się, aby głosować na statystyki.'
        : 'Nie udało się zapisać głosu. Spróbuj ponownie.';
      setErrorMessage(message);
    } finally {
      setVoteBusyId(null);
    }
  };

  const handleConvert = (statistic: Statistic) => {
    trackEvent('statistic_convert_cta', {
      statistic_id: statistic.id,
      origin: variant,
    });

    try {
      const antisticPrefill = buildAntisticPrefillFromStatistic(statistic);

      localStorage.setItem(
        'statistics:prefill',
        JSON.stringify({
          statisticId: statistic.id,
          antisticData: antisticPrefill,
          statisticSnapshot: {
            title: statistic.title,
            summary: statistic.summary,
            description: statistic.description ?? null,
            sourceUrl: statistic.sourceUrl,
            sourceCitation: statistic.sourceCitation ?? null,
            chartData: statistic.chartData ?? null,
          },
        })
      );
    } catch (error) {
      console.warn('Unable to persist statistic prefill data', error);
    }

    onNavigateToCreator(statistic);
  };

  const activeSortOptions = useMemo<StatisticsSortOption[]>(() => ['top', 'new', 'views'], []);

  const spacingClass = variant === 'embedded' ? 'space-y-6' : 'space-y-8';

  return (
    <div className={`${spacingClass} ${className}`.trim()}>
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
          {variant === 'embedded' ? 'Baza społeczności' : 'Wspólna baza danych'}
        </span>
        <h1 className={`font-bold text-gray-900 dark:text-white ${variant === 'embedded' ? 'text-2xl md:text-3xl' : 'text-4xl'}`}>
          Statystyki do przerobienia na antystyki
        </h1>
        <p className={`text-gray-600 dark:text-gray-300 ${variant === 'embedded' ? 'text-base max-w-2xl' : 'text-lg max-w-3xl'}`}>
          Przeglądaj wiarygodne dane, które nasi twórcy i moderatorzy wyselekcjonowali do dalszej obróbki. Głosuj,
          dziel się zaufaniem i przekształcaj je w ironiczne historie, które zmieniają czarno-białe myślenie.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm">
          {activeSortOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSort(option)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${sort === option
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              type="button"
            >
              {sortLabels[option]}
            </button>
          ))}
        </div>

        <button
          onClick={() => loadStatistics(true)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline-offset-4 hover:underline"
          type="button"
        >
          Odśwież
        </button>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-pulse text-gray-500">Ładuję statystyki...</div>
        </div>
      ) : statistics.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-20 text-center space-y-3">
          <div className="text-6xl">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Jeszcze nie ma żadnych statystyk</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Moderatorzy właśnie zbierają pierwsze dane. Zajrzyj później lub zaproponuj własną statystykę wśród społeczności.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {statistics.map((statistic) => (
            <StatisticCard
              key={statistic.id}
              statistic={statistic}
              onVote={handleVote}
              onConvert={handleConvert}
              isBusy={voteBusyId === statistic.id}
            />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center">
          <button
            onClick={() => loadStatistics(false)}
            disabled={loadingMore}
            className={`px-6 py-3 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-500 dark:hover:border-gray-400 transition-colors ${loadingMore ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            type="button"
          >
            {loadingMore ? 'Ładowanie...' : 'Pokaż więcej statystyk'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatisticsHub;


