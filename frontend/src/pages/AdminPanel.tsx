import React, { useEffect, useState } from 'react';
import type { Antistic, AntisticListResponse, Statistic } from '../types';
import type { AntisticData } from '../types/templates';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import AntisticCard from '../components/AntisticCard';
import { fetchPendingStatistics as fetchPendingStatisticsApi, moderateStatistic as moderateStatisticApi } from '../api/statistics';

const AdminPanel: React.FC = () => {
  const [pendingAntistics, setPendingAntistics] = useState<Antistic[]>([]);
  const [pendingStatistics, setPendingStatistics] = useState<Statistic[]>([]);
  const [loadingAntistics, setLoadingAntistics] = useState(true);
  const [loadingStatistics, setLoadingStatistics] = useState(true);
  const [antisticsError, setAntisticsError] = useState<string | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'statistics' | 'antistics'>('statistics');
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingAntistics();
    fetchPendingStatistics();
  }, []);

  const fetchPendingAntistics = async () => {
    try {
      const response = await api.get<AntisticListResponse>('/admin/antistics/pending');
      setPendingAntistics(response.data.items);
    } catch (error) {
      console.error('Error fetching pending antistics:', error);
      setAntisticsError('Nie udało się pobrać antystyków do moderacji.');
    } finally {
      setLoadingAntistics(false);
    }
  };

  const fetchPendingStatistics = async () => {
    try {
      const response = await fetchPendingStatisticsApi();
      setPendingStatistics(response.items);
    } catch (error) {
      console.error('Error fetching pending statistics:', error);
      setStatisticsError('Nie udało się pobrać statystyk oczekujących.');
    } finally {
      setLoadingStatistics(false);
    }
  };

  const handleModerate = async (id: string, approve: boolean) => {
    try {
      await api.post(`/admin/antistics/${id}/moderate`, {
        approve,
        rejectionReason: approve ? null : 'Odrzucone przez moderatora',
      });
      
      // Remove from list
      setPendingAntistics(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error moderating antistic:', error);
      alert('Błąd podczas moderacji');
    }
  };

  const handleModerateStatistic = async (id: string, approve: boolean) => {
    try {
      let moderatorNotes: string | null = null;
      if (!approve) {
        moderatorNotes = window.prompt('Podaj powód odrzucenia statystyki (opcjonalnie):') ?? null;
      }

      await moderateStatisticApi(id, approve, moderatorNotes);
      setPendingStatistics((prev) => prev.filter((stat) => stat.id !== id));
    } catch (error) {
      console.error('Error moderating statistic:', error);
      alert('Błąd podczas moderacji statystyki');
    }
  };

  // Only Admin and Moderator can access
  if (!user || (user.role !== 'Admin' && user.role !== 'Moderator')) {
    return <Navigate to="/" />;
  }

  const renderAntisticsSection = () => {
    if (loadingAntistics) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">Ładuję antystyki...</div>
        </div>
      );
    }

    if (antisticsError) {
      return (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm">
          {antisticsError}
        </div>
      );
    }

    if (pendingAntistics.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Brak antystyków do moderacji
          </h3>
          <p className="text-gray-600">
            Wszystkie antystyki zostały już przeglądnięte!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-lg text-gray-700">
            <strong>{pendingAntistics.length}</strong> antystyków oczekuje na moderację
          </p>
        </div>

        {pendingAntistics.map((antistic) => {
          const chartData: Partial<AntisticData> = {
            title: antistic.title,
            description: antistic.reversedStatistic,
            source: antistic.sourceUrl || 'antystyki.pl',
            templateId: (antistic as any).templateId || 'two-column-default',
            perspectiveData: (antistic as any).perspectiveData,
            sourceData: (antistic as any).sourceData,
          };

          return (
            <div key={antistic.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Podgląd karty
                  </h3>
                  <div className="max-w-md mx-auto">
                    <AntisticCard
                      antistic={antistic}
                      templateId={chartData.templateId}
                      customData={chartData}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Informacje o antystyku
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div>
                        <strong className="text-gray-700">Tytuł:</strong>
                        <p className="text-gray-900 mt-1">{antistic.title}</p>
                      </div>

                      <div>
                        <strong className="text-gray-700">Statystyka:</strong>
                        <p className="text-gray-900 mt-1">{antistic.reversedStatistic}</p>
                      </div>

                      {antistic.sourceUrl && (
                        <div>
                          <strong className="text-gray-700">Źródło:</strong>
                          <a
                            href={antistic.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-800 mt-1 break-all"
                          >
                            {antistic.sourceUrl}
                          </a>
                        </div>
                      )}

                      <div>
                        <strong className="text-gray-700">Autor:</strong>
                        <p className="text-gray-900 mt-1">{antistic.user.username}</p>
                      </div>

                      <div>
                        <strong className="text-gray-700">Data utworzenia:</strong>
                        <p className="text-gray-900 mt-1">
                          {new Date(antistic.createdAt).toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {antistic.categories.length > 0 && (
                        <div>
                          <strong className="text-gray-700">Kategorie:</strong>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {antistic.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {cat.namePl}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Akcje moderacji</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleModerate(antistic.id, true)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        ✅ Zatwierdź i opublikuj
                      </button>
                      <button
                        onClick={() => handleModerate(antistic.id, false)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        ❌ Odrzuć
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatisticsSection = () => {
    if (loadingStatistics) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">Ładuję statystyki...</div>
        </div>
      );
    }

    if (statisticsError) {
      return (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm">
          {statisticsError}
        </div>
      );
    }

    if (pendingStatistics.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Brak statystyk w kolejce
          </h3>
          <p className="text-gray-600">
            Wszystkie statystyki zostały już przejrzane lub czekają na dodanie.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-gray-700">
            <strong>{pendingStatistics.length}</strong> statystyk oczekuje na ocenę i publikację
          </p>
        </div>

        {pendingStatistics.map((statistic) => (
          <div key={statistic.id} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
              <div className="space-y-3 flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{statistic.title}</h3>
                <p className="text-gray-700 leading-relaxed">{statistic.summary}</p>
                {statistic.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-4">
                    {statistic.description}
                  </p>
                )}
              </div>
              <div className="w-full lg:w-72 space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-gray-700">Źródło:</span>{' '}
                  <a
                    href={statistic.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {statistic.sourceCitation || statistic.sourceUrl}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Dodane przez:</span>{' '}
                  {statistic.createdBy.username}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Dodano:</span>{' '}
                  {new Date(statistic.createdAt).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Głosy:</span>{' '}
                  👍 {statistic.likeCount} · 👎 {statistic.dislikeCount}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-500">
                Wejścia: {statistic.viewsCount} · Zaufanie: {statistic.trustPoints} · Fake: {statistic.fakePoints}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleModerateStatistic(statistic.id, true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  type="button"
                >
                  ✅ Publikuj jako bazę
                </button>
                <button
                  onClick={() => handleModerateStatistic(statistic.id, false)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                  type="button"
                >
                  ❌ Odrzuć
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Moderatora</h1>
            <p className="text-sm text-gray-500 mt-1">
              Zarządzaj kolejką statystyk i antystyków z zachowaniem misji „witty gray-area stories”.
            </p>
          </div>
          <div className="text-sm text-gray-600 text-right">
            Moderator: <span className="font-semibold">{user.username}</span>
            {user.role && (
              <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                {user.role}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 bg-white border border-gray-200 rounded-full p-1 w-fit">
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === 'statistics'
                  ? 'bg-gray-900 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              Statystyki ({pendingStatistics.length})
            </button>
            <button
              onClick={() => setActiveTab('antistics')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === 'antistics'
                  ? 'bg-gray-900 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              Antystyki ({pendingAntistics.length})
            </button>
          </div>

          <Link
            to="/admin/statistics/create"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            + Dodaj statystykę
          </Link>
        </div>

        <section className="pb-16">
          {activeTab === 'statistics' ? renderStatisticsSection() : renderAntisticsSection()}
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;

