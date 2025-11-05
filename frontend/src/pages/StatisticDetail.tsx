import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatisticCard from '../components/StatisticCard';
import type { Statistic } from '../types';
import { fetchStatistic, voteOnStatistic } from '../api/statistics';
import { buildAntisticPrefillFromStatistic } from '../utils/statisticPrefill';
import { extractIdFromSlug } from '../utils/share';
import { trackEvent } from '../utils/analytics';

const StatisticDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [statistic, setStatistic] = useState<Statistic | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteBusy, setVoteBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statisticId = useMemo(() => extractIdFromSlug(slug ?? ''), [slug]);

  useEffect(() => {
    if (!statisticId) {
      setErrorMessage('Nie znaleziono takiej statystyki.');
      setLoading(false);
      return;
    }

    const loadStatistic = async () => {
      try {
        setLoading(true);
        const data = await fetchStatistic(statisticId);
        setStatistic(data);
        trackEvent('statistic_detail_view', {
          statistic_id: data.id,
        });
      } catch (error) {
        console.error('Failed to load statistic', error);
        setErrorMessage('Nie udało się załadować statystyki. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };

    loadStatistic();
  }, [statisticId]);

  const handleVote = async (id: string, voteType: 'Like' | 'Dislike', remove: boolean) => {
    if (!statistic) {
      return;
    }

    try {
      setVoteBusy(true);
      const response = await voteOnStatistic(id, voteType, remove);
      setStatistic((prev) => {
        if (!prev) {
          return prev;
        }

        const updated: Statistic = {
          ...prev,
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
      });
    } catch (error) {
      console.error('Failed to submit vote', error);
      setErrorMessage('Nie udało się zapisać głosu. Odśwież stronę i spróbuj ponownie.');
    } finally {
      setVoteBusy(false);
    }
  };

  const handleConvert = (selectedStatistic: Statistic) => {
    trackEvent('statistic_convert_cta', {
      statistic_id: selectedStatistic.id,
    });

    try {
      const antisticPrefill = buildAntisticPrefillFromStatistic(selectedStatistic);
      localStorage.setItem(
        'statistics:prefill',
        JSON.stringify({
          statisticId: selectedStatistic.id,
          antisticData: antisticPrefill,
          statisticSnapshot: {
            title: selectedStatistic.title,
            summary: selectedStatistic.summary,
            description: selectedStatistic.description ?? null,
            sourceUrl: selectedStatistic.sourceUrl,
            sourceCitation: selectedStatistic.sourceCitation ?? null,
            chartData: selectedStatistic.chartData ?? null,
          },
        })
      );
    } catch (error) {
      console.warn('Unable to persist statistic prefill data', error);
    }

    navigate('/create', { state: { fromStatisticId: selectedStatistic.id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center text-gray-500">
          Ładuję statystykę...
        </div>
      </div>
    );
  }

  if (!statisticId || errorMessage) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-lg font-medium text-gray-700">{errorMessage ?? 'Nie znaleziono statystyki.'}</p>
          <button
            type="button"
            onClick={() => navigate('/statistics')}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-500 hover:text-gray-900"
          >
            <span aria-hidden>←</span>
            Wróć do listy statystyk
          </button>
        </div>
      </div>
    );
  }

  if (!statistic) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <span aria-hidden>←</span>
          Wróć
        </button>

        <StatisticCard
          statistic={statistic}
          onVote={handleVote}
          onConvert={handleConvert}
          isBusy={voteBusy}
        />
      </div>
    </div>
  );
};

export default StatisticDetailPage;


