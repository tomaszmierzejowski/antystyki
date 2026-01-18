import React, { useEffect, useState } from 'react';
import type { Antistic, AntisticListResponse, Statistic } from '../types';
import type { AntisticData } from '../types/templates';
import api from '../config/api';
import { useAuth } from '../context/useAuth';
import { Link, Navigate } from 'react-router-dom';
import AntisticCard from '../components/AntisticCard';
import { fetchPendingStatistics as fetchPendingStatisticsApi, moderateStatistic as moderateStatisticApi } from '../api/statistics';
import adminApi from '../api/admin';

type GeneratedDraft = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceCitation: string;
  kind: 'statistic' | 'antystyk' | string;
};

type ValidationIssue = {
  sourceId: string;
  sourceName: string;
  title: string;
  reason: string;
  sourceUrl?: string;
  sourceStatusCode?: number;
  percentageValue?: number;
  ratio?: string;
  timeframe?: string;
  contextSentence?: string;
};

type ContentGenerationResult = {
  createdStatistics: GeneratedDraft[];
  createdAntystics: GeneratedDraft[];
  skippedDuplicates: string[];
  sourceFailures: string[];
  validationFailures: string[];
  validationIssues?: ValidationIssue[];
  executedAt: string;
  dryRun: boolean;
};

const AdminPanel: React.FC = () => {
  const [pendingAntistics, setPendingAntistics] = useState<Antistic[]>([]);
  const [pendingStatistics, setPendingStatistics] = useState<Statistic[]>([]);
  const [loadingAntistics, setLoadingAntistics] = useState(true);
  const [loadingStatistics, setLoadingStatistics] = useState(true);
  const [antisticsError, setAntisticsError] = useState<string | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'statistics' | 'antistics'>('statistics');
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenMessage, setAutoGenMessage] = useState<string | null>(null);
  const [autoGenSummary, setAutoGenSummary] = useState<ContentGenerationResult | null>(null);
  const [autoGenStatsTarget, setAutoGenStatsTarget] = useState(5);
  const [autoGenAntysticsTarget, setAutoGenAntysticsTarget] = useState(2);
  const [autoGenSourceIds, setAutoGenSourceIds] = useState('');
  const { user } = useAuth();
  const canViewWebsiteStats = user?.email?.toLowerCase() === 'tmierzejowski@gmail.com';

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

  const handleRunAutoGeneration = async (dryRun: boolean) => {
    if (!canViewWebsiteStats) return;
    setAutoGenLoading(true);
    setAutoGenMessage(null);
    try {
      const sourceIds = autoGenSourceIds
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      const data: ContentGenerationResult = await adminApi.runContentGeneration({
        dryRun,
        statistics: autoGenStatsTarget,
        antystics: autoGenAntysticsTarget,
        sourceIds: sourceIds.length > 0 ? sourceIds : undefined,
      });
      setAutoGenSummary(data);
      setAutoGenMessage(dryRun ? 'Suche uruchomienie zakończone — nic nie zapisano.' : 'Wygenerowano nowe drafty (pending_review).');
      // Refresh queues if persisted
      if (!dryRun) {
        fetchPendingAntistics();
        fetchPendingStatistics();
      }
    } catch (error) {
      console.error('Error triggering auto-generation:', error);
      setAutoGenMessage('Nie udało się uruchomić generowania. Sprawdź uprawnienia lub backend.');
    } finally {
      setAutoGenLoading(false);
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
          const antisticChartData = antistic.chartData ?? {};
          const isUpdateRequest = !!antistic.originalAntisticId;

          const chartData: Partial<AntisticData> = {
            title: antistic.title,
            description: antistic.reversedStatistic,
            source: antistic.sourceUrl || 'antystyki.pl',
            templateId: antisticChartData.templateId ?? antistic.templateId ?? 'two-column-default',
            perspectiveData: antisticChartData.perspectiveData,
            sourceData: antisticChartData.sourceData,
            singleChartData: antisticChartData.singleChartData,
            textData: antisticChartData.textData,
            comparisonData: antisticChartData.comparisonData,
          };

          return (
            <div key={antistic.id} className={`bg-white rounded-lg border p-6 ${isUpdateRequest ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Podgląd karty
                    </h3>
                    {isUpdateRequest && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-amber-200">
                            EDYCJA / AKTUALIZACJA
                        </span>
                    )}
                  </div>
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

                      {isUpdateRequest && (
                         <div className="bg-amber-50 p-2 rounded border border-amber-100 text-xs text-amber-800">
                            <strong>To jest prośba o aktualizację</strong> istniejącego antystyku. 
                            Zatwierdzenie spowoduje nadpisanie oryginału.
                             <div className="mt-1">
                                <Link to={`/antistic/${antistic.originalAntisticId}`} target="_blank" className="underline hover:text-amber-900">
                                    Zobacz oryginał
                                </Link>
                             </div>
                         </div>
                      )}

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
                        {isUpdateRequest ? '✅ Zatwierdź zmiany (Merge)' : '✅ Zatwierdź i opublikuj'}
                      </button>
                      <button
                        onClick={() => handleModerate(antistic.id, false)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        {isUpdateRequest ? '❌ Odrzuć zmiany' : '❌ Odrzuć'}
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
          <div className="text-sm text-gray-600 text-right space-y-2">
            <div>
              Moderator: <span className="font-semibold">{user.username}</span>
              {user.role && (
                <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {user.role}
                </span>
              )}
            </div>
            {canViewWebsiteStats && (
              <div className="flex flex-col gap-2 items-end">
                <Link
                  to="/admin/statistics"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  📈 Website Statistics
                </Link>
                <div className="w-full max-w-xs bg-white border border-gray-200 rounded-xl p-3 space-y-2 text-xs text-gray-700">
                  <div className="font-semibold text-gray-900">AUTO-GEN-DAILY</div>
                  <label className="flex items-center justify-between gap-2">
                    <span>Statystyki</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={autoGenStatsTarget}
                      onChange={(event) => setAutoGenStatsTarget(Number(event.target.value))}
                      className="w-16 border border-gray-200 rounded-md px-2 py-1 text-right"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Antystyki</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={autoGenAntysticsTarget}
                      onChange={(event) => setAutoGenAntysticsTarget(Number(event.target.value))}
                      className="w-16 border border-gray-200 rounded-md px-2 py-1 text-right"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block">Źródła (opcjonalnie, CSV)</span>
                    <input
                      type="text"
                      placeholder="gus-bdl-api, eurostat-api"
                      value={autoGenSourceIds}
                      onChange={(event) => setAutoGenSourceIds(event.target.value)}
                      className="w-full border border-gray-200 rounded-md px-2 py-1"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunAutoGeneration(true)}
                    disabled={autoGenLoading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
                  >
                    🔍 Suchy run (07:00 job)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunAutoGeneration(false)}
                    disabled={autoGenLoading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    ⚡ Uruchom teraz
                  </button>
                </div>
                {autoGenMessage && (
                  <div className="text-xs text-left max-w-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    {autoGenMessage}
                    {autoGenSummary && (
                      <div className="mt-2 space-y-1">
                        <div>Statystyki: {autoGenSummary.createdStatistics.length}</div>
                        <div>Antystyki: {autoGenSummary.createdAntystics.length}</div>
                        {autoGenSummary.validationIssues && autoGenSummary.validationIssues.length > 0 && (
                          <div className="text-amber-700">
                            Odrzucone: {autoGenSummary.validationIssues.length}
                          </div>
                        )}
                        {autoGenSummary.skippedDuplicates.length > 0 && (
                          <div className="text-amber-700">
                            Pomiń dup.: {autoGenSummary.skippedDuplicates.length}
                          </div>
                        )}
                        {autoGenSummary.sourceFailures.length > 0 && (
                          <div className="text-rose-700">
                            Źródła offline: {autoGenSummary.sourceFailures.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {autoGenSummary?.validationIssues && autoGenSummary.validationIssues.length > 0 && (
                  <div className="text-xs text-left max-w-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="font-semibold text-amber-900">Odrzucone kandydaty</div>
                    <div className="mt-1 space-y-2">
                      {autoGenSummary.validationIssues.slice(0, 6).map((issue, index) => (
                        <div key={`${issue.sourceId}-${index}`} className="border-b border-amber-100 pb-2 last:border-b-0 last:pb-0">
                          <div className="font-medium text-gray-900">{issue.title}</div>
                          <div className="text-amber-800">{issue.reason}</div>
                          <div className="text-gray-600">
                            {issue.percentageValue != null && (
                              <span> {issue.percentageValue.toFixed(1)}%</span>
                            )}
                            {issue.ratio && <span> · {issue.ratio}</span>}
                            {issue.timeframe && <span> · {issue.timeframe}</span>}
                          </div>
                        </div>
                      ))}
                      {autoGenSummary.validationIssues.length > 6 && (
                        <div className="text-amber-800">...i więcej</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

