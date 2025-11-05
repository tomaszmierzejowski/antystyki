import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Antistic } from '../types';
import AntisticCard from '../components/AntisticCard';
import { fetchAntistic } from '../api/antistics';
import { extractIdFromSlug } from '../utils/share';
import { trackAntisticView } from '../utils/analytics';

const AntisticDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [antistic, setAntistic] = useState<Antistic | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const antisticId = useMemo(() => extractIdFromSlug(slug ?? ''), [slug]);

  useEffect(() => {
    if (!antisticId) {
      setErrorMessage('Nie znaleziono takiego antystyku.');
      setLoading(false);
      return;
    }

    const loadAntistic = async () => {
      try {
        setLoading(true);
        const data = await fetchAntistic(antisticId);
        setAntistic(data);
        trackAntisticView(data.id, data.title, data.categories?.[0]?.slug);
      } catch (error) {
        console.error('Failed to load antistic', error);
        setErrorMessage('Nie udało się załadować antystyku. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };

    loadAntistic();
  }, [antisticId]);

  const refreshAntistic = async () => {
    if (!antisticId) {
      return;
    }
    try {
      const updated = await fetchAntistic(antisticId);
      setAntistic(updated);
    } catch (error) {
      console.error('Failed to refresh antistic after admin action', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center text-gray-500">
          Ładuję antystyk...
        </div>
      </div>
    );
  }

  if (!antisticId || errorMessage) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-lg font-medium text-gray-700">{errorMessage ?? 'Nie znaleziono antystyku.'}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-500 hover:text-gray-900"
          >
            <span aria-hidden>←</span>
            Wróć do listy antystyków
          </button>
        </div>
      </div>
    );
  }

  if (!antistic) {
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

        <AntisticCard antistic={antistic} onAdminAction={refreshAntistic} />
      </div>
    </div>
  );
};

export default AntisticDetailPage;


